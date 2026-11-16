export type Plan = 'monthly' | 'yearly';

/** Subset of Stripe subscription statuses we store and reason about. */
export type SubscriptionStatus =
  | 'active'
  | 'trialing'
  | 'past_due'
  | 'canceled'
  | 'unpaid'
  | 'incomplete'
  | 'incomplete_expired'
  | 'paused';

export interface Subscription {
  userId: string;
  subscriptionId: string;
  customerId: string;
  status: SubscriptionStatus;
  plan: Plan | null;
  /** Unix seconds. End of the paid period. */
  currentPeriodEnd: number | null;
  cancelAtPeriodEnd: boolean;
  /** Set when an invoice payment failed and cleared on the next successful update. */
  paymentIssue: boolean;
  /** `created` of the last Stripe event applied, used to ignore out-of-order deliveries. */
  lastEventCreated: number;
  updatedAt: string;
}

/**
 * Who gets premium content.
 * - active / trialing: yes
 * - past_due: yes, as a grace period while Stripe retries the payment
 * - everything else: no
 */
export function hasPremiumAccess(sub: Subscription | null): boolean {
  if (!sub) return false;
  return sub.status === 'active' || sub.status === 'trialing' || sub.status === 'past_due';
}

export const PRICE_LOOKUP_KEYS: Record<Plan, string> = {
  monthly: 'epoch_premium_monthly',
  yearly: 'epoch_premium_yearly',
};

export function planFromLookupKey(key: string | null | undefined): Plan | null {
  if (key === PRICE_LOOKUP_KEYS.monthly) return 'monthly';
  if (key === PRICE_LOOKUP_KEYS.yearly) return 'yearly';
  return null;
}
