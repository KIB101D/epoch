import Stripe from 'stripe';
import { PRICE_LOOKUP_KEYS, planFromLookupKey, type Plan } from '../domain/subscription.js';

export interface PriceInfo {
  plan: Plan;
  amount: number; // minor units, e.g. cents
  currency: string;
  interval: 'month' | 'year';
}

/**
 * Everything the API needs from the payment provider. Routes depend on this interface,
 * so swapping Stripe for another provider (e.g. Solidgate) only means a new implementation.
 */
export interface BillingGateway {
  createCustomer(userId: string): Promise<string>;
  createCheckoutUrl(args: { customerId: string; userId: string; plan: Plan; successUrl: string; cancelUrl: string }): Promise<string>;
  createPortalUrl(customerId: string, returnUrl: string): Promise<string>;
  listPrices(): Promise<PriceInfo[]>;
  verifyWebhook(rawBody: Buffer, signature: string): Stripe.Event;
}

export class StripeGateway implements BillingGateway {
  private pricesCache: { at: number; prices: (PriceInfo & { id: string })[] } | null = null;

  constructor(
    private readonly stripe: Stripe,
    private readonly webhookSecret: string,
  ) {}

  async createCustomer(userId: string) {
    // The customer is created before checkout and tagged with our user id, so every later
    // webhook (subscription created, invoice failed, ...) can be mapped back to the user.
    const customer = await this.stripe.customers.create({ metadata: { userId } });
    return customer.id;
  }

  private async prices() {
    if (this.pricesCache && Date.now() - this.pricesCache.at < 5 * 60_000) return this.pricesCache.prices;
    const res = await this.stripe.prices.list({ lookup_keys: Object.values(PRICE_LOOKUP_KEYS), active: true });
    const prices = res.data.flatMap((p) => {
      const plan = planFromLookupKey(p.lookup_key);
      if (!plan || !p.unit_amount || !p.recurring) return [];
      return [{ id: p.id, plan, amount: p.unit_amount, currency: p.currency, interval: p.recurring.interval as 'month' | 'year' }];
    });
    this.pricesCache = { at: Date.now(), prices };
    return prices;
  }

  async listPrices() {
    return (await this.prices()).map(({ id: _id, ...rest }) => rest);
  }

  async createCheckoutUrl({ customerId, userId, plan, successUrl, cancelUrl }: Parameters<BillingGateway['createCheckoutUrl']>[0]) {
    const price = (await this.prices()).find((p) => p.plan === plan);
    if (!price) throw new Error(`Price for plan "${plan}" not found. Run "npm run stripe:setup".`);
    const session = await this.stripe.checkout.sessions.create({
      mode: 'subscription',
      customer: customerId,
      client_reference_id: userId,
      line_items: [{ price: price.id, quantity: 1 }],
      subscription_data: { metadata: { userId } },
      success_url: successUrl,
      cancel_url: cancelUrl,
      allow_promotion_codes: true,
    });
    if (!session.url) throw new Error('Stripe did not return a checkout URL');
    return session.url;
  }

  async createPortalUrl(customerId: string, returnUrl: string) {
    const session = await this.stripe.billingPortal.sessions.create({ customer: customerId, return_url: returnUrl });
    return session.url;
  }

  verifyWebhook(rawBody: Buffer, signature: string) {
    return this.stripe.webhooks.constructEvent(rawBody, signature, this.webhookSecret);
  }
}
