import { beforeEach, describe, expect, it } from 'vitest';
import { hasPremiumAccess } from '../src/domain/subscription.js';
import { MemoryRepo } from '../src/repo/memory.js';
import { handleStripeEvent } from '../src/stripe/webhook.js';
import { event, subscriptionObject } from './helpers.js';

describe('handleStripeEvent', () => {
  let repo: MemoryRepo;

  beforeEach(async () => {
    repo = new MemoryRepo();
    await repo.createUser('u1');
    await repo.linkCustomer('u1', 'cus_1');
  });

  it('activates premium when a subscription is created', async () => {
    const outcome = await handleStripeEvent(
      event('customer.subscription.created', subscriptionObject({ customer: 'cus_1', plan: 'yearly' })),
      repo,
    );
    const sub = await repo.getSubscription('u1');
    expect(outcome).toBe('processed');
    expect(sub).toMatchObject({ status: 'active', plan: 'yearly', currentPeriodEnd: 1_800_000_000 });
    expect(hasPremiumAccess(sub)).toBe(true);
  });

  it('applies a duplicate delivery only once', async () => {
    const evt = event('customer.subscription.created', subscriptionObject({ customer: 'cus_1' }), { id: 'evt_dup' });
    expect(await handleStripeEvent(evt, repo)).toBe('processed');
    expect(await handleStripeEvent(evt, repo)).toBe('duplicate');
  });

  it('ignores an older event that arrives after a newer one', async () => {
    await handleStripeEvent(
      event('customer.subscription.deleted', subscriptionObject({ customer: 'cus_1', status: 'canceled' }), { created: 2000 }),
      repo,
    );
    await handleStripeEvent(
      event('customer.subscription.updated', subscriptionObject({ customer: 'cus_1', status: 'active' }), { created: 1000 }),
      repo,
    );
    const sub = await repo.getSubscription('u1');
    expect(sub?.status).toBe('canceled');
    expect(hasPremiumAccess(sub)).toBe(false);
  });

  it('keeps access during past_due as a grace period and flags the payment issue', async () => {
    await handleStripeEvent(
      event('customer.subscription.updated', subscriptionObject({ customer: 'cus_1', status: 'past_due' })),
      repo,
    );
    const sub = await repo.getSubscription('u1');
    expect(sub?.paymentIssue).toBe(true);
    expect(hasPremiumAccess(sub)).toBe(true);
  });

  it('marks a payment issue on invoice.payment_failed', async () => {
    await handleStripeEvent(event('customer.subscription.created', subscriptionObject({ customer: 'cus_1' }), { created: 10 }), repo);
    await handleStripeEvent(event('invoice.payment_failed', { object: 'invoice', customer: 'cus_1' }, { created: 20 }), repo);
    expect((await repo.getSubscription('u1'))?.paymentIssue).toBe(true);
  });

  it('keeps the plan active until period end when the user cancels', async () => {
    await handleStripeEvent(
      event('customer.subscription.updated', subscriptionObject({ customer: 'cus_1', cancelAtPeriodEnd: true })),
      repo,
    );
    const sub = await repo.getSubscription('u1');
    expect(sub?.cancelAtPeriodEnd).toBe(true);
    expect(hasPremiumAccess(sub)).toBe(true);
  });

  it('stores the checkout email', async () => {
    await handleStripeEvent(
      event('checkout.session.completed', {
        object: 'checkout.session',
        customer: 'cus_1',
        client_reference_id: 'u1',
        customer_details: { email: 'reader@example.com' },
      }),
      repo,
    );
    expect((await repo.getUser('u1'))?.email).toBe('reader@example.com');
  });

  it('ignores events for unknown customers', async () => {
    const outcome = await handleStripeEvent(
      event('customer.subscription.created', subscriptionObject({ customer: 'cus_unknown' })),
      repo,
    );
    expect(outcome).toBe('ignored');
  });

  it('releases the event when applying it fails, so a Stripe retry can succeed', async () => {
    const failingOnce = Object.assign(Object.create(repo), {
      calls: 0,
      async putSubscriptionIfNewer(this: { calls: number }, ...args: Parameters<MemoryRepo['putSubscriptionIfNewer']>) {
        this.calls += 1;
        if (this.calls === 1) throw new Error('DynamoDB is having a bad day');
        return repo.putSubscriptionIfNewer(...args);
      },
    }) as MemoryRepo;

    const evt = event('customer.subscription.created', subscriptionObject({ customer: 'cus_1' }), { id: 'evt_retry' });
    await expect(handleStripeEvent(evt, failingOnce)).rejects.toThrow('bad day');
    expect(await handleStripeEvent(evt, failingOnce)).toBe('processed');
    expect((await repo.getSubscription('u1'))?.status).toBe('active');
  });
});
