/**
 * Sends a correctly signed "customer.subscription.created" webhook to the demo API,
 * exactly like Stripe would after a successful checkout.
 *
 *   npm run demo:pay            # yearly plan for the first demo customer
 */
import { event, signedWebhook, subscriptionObject } from '../tests/helpers.js';

const customer = process.argv[2] ?? 'cus_fake_1';
const evt = event(
  'customer.subscription.created',
  subscriptionObject({ customer, plan: 'yearly', periodEnd: Math.floor(Date.now() / 1000) + 365 * 86400 }),
  { created: Math.floor(Date.now() / 1000) },
);
const { payload, signature } = signedWebhook(evt);
const res = await fetch('http://127.0.0.1:4000/webhooks/stripe', {
  method: 'POST',
  headers: { 'content-type': 'application/json', 'stripe-signature': signature },
  body: payload,
});
console.log(res.status, await res.text());
