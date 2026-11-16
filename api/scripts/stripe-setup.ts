/**
 * Creates the "Epoch Premium" product with a monthly and a yearly price in your Stripe
 * test account. Prices are found later by lookup key, so no price ids go into .env.
 *
 *   npm run stripe:setup
 */
import Stripe from 'stripe';
import { PRICE_LOOKUP_KEYS } from '../src/domain/subscription.js';

const key = process.env.STRIPE_SECRET_KEY;
if (!key?.startsWith('sk_test_')) {
  console.error('Set STRIPE_SECRET_KEY to a test-mode key (sk_test_...) first.');
  process.exit(1);
}
const stripe = new Stripe(key);

const existing = await stripe.prices.list({ lookup_keys: Object.values(PRICE_LOOKUP_KEYS) });
if (existing.data.length === 2) {
  console.log('Prices already exist:', existing.data.map((p) => `${p.lookup_key} (${p.id})`).join(', '));
  process.exit(0);
}

const product = await stripe.products.create({
  name: 'Epoch Premium',
  description: 'All interactive history lessons, every era.',
});

const plans = [
  { lookup_key: PRICE_LOOKUP_KEYS.monthly, unit_amount: 999, interval: 'month' as const },
  { lookup_key: PRICE_LOOKUP_KEYS.yearly, unit_amount: 5999, interval: 'year' as const },
];

for (const p of plans) {
  const price = await stripe.prices.create({
    product: product.id,
    currency: 'usd',
    unit_amount: p.unit_amount,
    recurring: { interval: p.interval },
    lookup_key: p.lookup_key,
    transfer_lookup_key: true,
  });
  console.log(`Created ${p.lookup_key}: ${price.id}`);
}
