import type Stripe from 'stripe';
import { planFromLookupKey, type Subscription, type SubscriptionStatus } from '../domain/subscription.js';
import type { Repo } from '../repo/types.js';

export type WebhookOutcome = 'processed' | 'duplicate' | 'ignored';

const customerIdOf = (c: string | { id: string } | null | undefined) =>
  !c ? null : typeof c === 'string' ? c : c.id;

/** Newer Stripe API versions moved the billing period onto subscription items. */
function periodEnd(sub: Stripe.Subscription): number | null {
  const fromItem = (sub.items?.data?.[0] as { current_period_end?: number } | undefined)?.current_period_end;
  const legacy = (sub as unknown as { current_period_end?: number }).current_period_end;
  return fromItem ?? legacy ?? null;
}

async function resolveUserId(repo: Repo, customerId: string | null, metadataUserId?: string | null) {
  if (metadataUserId) return metadataUserId;
  if (!customerId) return null;
  return repo.findUserIdByCustomer(customerId);
}

/**
 * Applies a verified Stripe event to our state.
 *
 * Guarantees:
 * - idempotent: the same event id is applied once, even if Stripe delivers it again;
 * - order-safe: an older subscription event never overwrites a newer one;
 * - retry-safe: if applying fails, the event is released so Stripe's retry can apply it.
 */
export async function handleStripeEvent(event: Stripe.Event, repo: Repo): Promise<WebhookOutcome> {
  const claimed = await repo.claimEvent(event.id, event.type);
  if (!claimed) return 'duplicate';

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        const userId = await resolveUserId(repo, customerIdOf(session.customer), session.client_reference_id);
        const email = session.customer_details?.email;
        if (!userId) return 'ignored';
        if (email) await repo.setEmail(userId, email);
        return 'processed';
      }

      case 'customer.subscription.created':
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted': {
        const s = event.data.object;
        const customerId = customerIdOf(s.customer);
        const userId = await resolveUserId(repo, customerId, s.metadata?.userId);
        if (!userId || !customerId) return 'ignored';

        const status = s.status as SubscriptionStatus;
        const sub: Subscription = {
          userId,
          subscriptionId: s.id,
          customerId,
          status,
          plan: planFromLookupKey(s.items?.data?.[0]?.price?.lookup_key),
          currentPeriodEnd: periodEnd(s),
          cancelAtPeriodEnd: Boolean(s.cancel_at_period_end),
          paymentIssue: status === 'past_due' || status === 'unpaid',
          lastEventCreated: event.created,
          updatedAt: new Date().toISOString(),
        };
        await repo.putSubscriptionIfNewer(sub);
        return 'processed';
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object;
        const userId = await resolveUserId(repo, customerIdOf(invoice.customer));
        if (!userId) return 'ignored';
        await repo.markPaymentIssue(userId, event.created);
        return 'processed';
      }

      default:
        return 'ignored';
    }
  } catch (err) {
    await repo.releaseEvent(event.id);
    throw err;
  }
}
