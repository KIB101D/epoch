/**
 * Runs the API with an in-memory store and a fake billing gateway: no AWS or Stripe keys needed.
 * Useful to click through the funnel. Checkout returns a fake URL; simulate payment with
 * `npm run demo:pay` in another terminal.
 *
 *   npm run demo
 */
import { buildApp } from '../src/app.js';
import { MemoryRepo } from '../src/repo/memory.js';
import { FakeBilling } from '../tests/helpers.js';

const app = buildApp({
  repo: new MemoryRepo(),
  billing: new FakeBilling(),
  cookieSecret: 'demo-cookie-secret-123456',
  webUrl: 'http://localhost:3000',
  logger: true,
});
await app.listen({ port: 4000, host: '127.0.0.1' });
