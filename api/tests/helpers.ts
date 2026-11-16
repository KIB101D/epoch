import Stripe from 'stripe';
import { buildApp } from '../src/http.js';
import type { Plan } from '../src/domain/subscription.js';
import { PRICE_LOOKUP_KEYS } from '../src/domain/subscription.js';
import { MemoryRepo } from '../src/repo/memory.js';
import type { BillingGateway } from '../src/stripe/gateway.js';

export const WEBHOOK_SECRET = 'whsec_test_secret_for_unit_tests';
const stripe = new Stripe('sk_test_dummy');

let seq = 0;
export function event(type: string, object: object, opts: { id?: string; created?: number } = {}): Stripe.Event {
  seq += 1;
  return {
    id: opts.id ?? `evt_${seq}`,
    object: 'event',
    type,
    created: opts.created ?? 1_700_000_000 + seq,
    data: { object },
    api_version: '2025-01-01',
    livemode: false,
    pending_webhooks: 1,
    request: { id: null, idempotency_key: null },
  } as unknown as Stripe.Event;
}

export function subscriptionObject(opts: {
  customer: string;
  status?: string;
  plan?: Plan;
  userId?: string;
  periodEnd?: number;
  cancelAtPeriodEnd?: boolean;
}) {
  return {
    id: 'sub_123',
    object: 'subscription',
    customer: opts.customer,
    status: opts.status ?? 'active',
    cancel_at_period_end: opts.cancelAtPeriodEnd ?? false,
    metadata: opts.userId ? { userId: opts.userId } : {},
    items: {
      data: [
        {
          current_period_end: opts.periodEnd ?? 1_800_000_000,
          price: { lookup_key: PRICE_LOOKUP_KEYS[opts.plan ?? 'monthly'] },
        },
      ],
    },
  };
}

/** Signs a payload exactly like Stripe does, so the real verification code path is exercised. */
export function signedWebhook(evt: Stripe.Event) {
  const payload = JSON.stringify(evt);
  const signature = stripe.webhooks.generateTestHeaderString({ payload, secret: WEBHOOK_SECRET });
  return { payload, signature };
}

export class FakeBilling implements BillingGateway {
  customersCreated = 0;
  async createCustomer() {
    this.customersCreated += 1;
    return `cus_fake_${this.customersCreated}`;
  }
  async createCheckoutUrl({ plan }: { plan: Plan }) {
    return `https://checkout.stripe.test/${plan}`;
  }
  async createPortalUrl() {
    return 'https://billing.stripe.test/portal';
  }
  async listPrices() {
    return [
      { plan: 'monthly' as const, amount: 999, currency: 'usd', interval: 'month' as const },
      { plan: 'yearly' as const, amount: 5999, currency: 'usd', interval: 'year' as const },
    ];
  }
  verifyWebhook(rawBody: Buffer, signature: string) {
    return stripe.webhooks.constructEvent(rawBody, signature, WEBHOOK_SECRET);
  }
}

export function testApp() {
  const repo = new MemoryRepo();
  const billing = new FakeBilling();
  const app = buildApp({ repo, billing, cookieSecret: 'test-cookie-secret-123456', webUrl: 'http://localhost:3000' });
  return { app, repo, billing };
}
