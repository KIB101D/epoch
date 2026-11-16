import { describe, expect, it } from 'vitest';
import { event, signedWebhook, subscriptionObject, testApp } from './helpers.js';

const answers = { era: 'napoleon', goal: 'curiosity', minutesPerDay: 10 };

async function startFunnel(app: ReturnType<typeof testApp>['app']) {
  const res = await app.inject({ method: 'POST', url: '/funnel', payload: answers });
  const setCookie = res.headers['set-cookie'];
  const cookie = (Array.isArray(setCookie) ? setCookie[0] : setCookie)!.split(';')[0];
  return { res, cookie, userId: res.json().userId as string };
}

describe('API', () => {
  it('creates an anonymous session and a personal plan from the quiz', async () => {
    const { app } = testApp();
    const { res } = await startFunnel(app);
    expect(res.statusCode).toBe(200);
    expect(res.json().plan).toMatchObject({ era: 'napoleon', eraTitle: 'Napoleon' });
    expect(res.headers['set-cookie']).toContain('HttpOnly');
  });

  it('rejects invalid quiz answers', async () => {
    const { app } = testApp();
    const res = await app.inject({ method: 'POST', url: '/funnel', payload: { era: 'atlantis' } });
    expect(res.statusCode).toBe(400);
  });

  it('rejects a missing or tampered session cookie', async () => {
    const { app } = testApp();
    expect((await app.inject({ method: 'GET', url: '/me' })).statusCode).toBe(401);
    const forged = await app.inject({ method: 'GET', url: '/me', headers: { cookie: 'epoch_uid=someone-else' } });
    expect(forged.statusCode).toBe(401);
  });

  it('serves free lessons to everyone and locks premium ones', async () => {
    const { app } = testApp();
    expect((await app.inject({ method: 'GET', url: '/lessons/napoleon-toulon' })).statusCode).toBe(200);
    const locked = await app.inject({ method: 'GET', url: '/lessons/napoleon-austerlitz' });
    expect(locked.statusCode).toBe(402);
    expect(locked.json().error).toBe('premium_required');
  });

  it('never sends story text in the lesson list', async () => {
    const { app } = testApp();
    const { lessons } = (await app.inject({ method: 'GET', url: '/lessons' })).json();
    expect(lessons).toHaveLength(15);
    for (const l of lessons) {
      expect(l).not.toHaveProperty('scenes');
      expect(l.decisions).toBeGreaterThanOrEqual(2);
    }
  });

  it('creates the Stripe customer once and returns a checkout URL', async () => {
    const { app, billing, repo } = testApp();
    const { cookie, userId } = await startFunnel(app);
    const first = await app.inject({ method: 'POST', url: '/billing/checkout', headers: { cookie }, payload: { plan: 'yearly' } });
    await app.inject({ method: 'POST', url: '/billing/checkout', headers: { cookie }, payload: { plan: 'monthly' } });
    expect(first.json().url).toBe('https://checkout.stripe.test/yearly');
    expect(billing.customersCreated).toBe(1);
    expect((await repo.getUser(userId))?.stripeCustomerId).toBe('cus_fake_1');
  });

  it('unlocks premium lessons after a verified webhook, end to end', async () => {
    const { app } = testApp();
    const { cookie } = await startFunnel(app);
    await app.inject({ method: 'POST', url: '/billing/checkout', headers: { cookie }, payload: { plan: 'monthly' } });

    const { payload, signature } = signedWebhook(
      event('customer.subscription.created', subscriptionObject({ customer: 'cus_fake_1' })),
    );
    const hook = await app.inject({
      method: 'POST',
      url: '/webhooks/stripe',
      headers: { 'content-type': 'application/json', 'stripe-signature': signature },
      payload,
    });
    expect(hook.json()).toEqual({ received: true, outcome: 'processed' });

    const me = await app.inject({ method: 'GET', url: '/me', headers: { cookie } });
    expect(me.json()).toMatchObject({ premium: true, subscription: { status: 'active', plan: 'monthly' } });
    const lesson = await app.inject({ method: 'GET', url: '/lessons/napoleon-austerlitz', headers: { cookie } });
    expect(lesson.statusCode).toBe(200);

    const again = await app.inject({ method: 'POST', url: '/billing/checkout', headers: { cookie }, payload: { plan: 'yearly' } });
    expect(again.statusCode).toBe(409);
  });

  it('rejects webhooks with an invalid signature', async () => {
    const { app } = testApp();
    const { payload } = signedWebhook(event('customer.subscription.created', subscriptionObject({ customer: 'cus_x' })));
    const res = await app.inject({
      method: 'POST',
      url: '/webhooks/stripe',
      headers: { 'content-type': 'application/json', 'stripe-signature': 't=1,v1=forged' },
      payload,
    });
    expect(res.statusCode).toBe(400);
  });

  it('tracks lesson progress without duplicates', async () => {
    const { app } = testApp();
    const { cookie } = await startFunnel(app);
    await app.inject({ method: 'POST', url: '/lessons/napoleon-toulon/complete', headers: { cookie } });
    await app.inject({ method: 'POST', url: '/lessons/napoleon-toulon/complete', headers: { cookie } });
    const me = await app.inject({ method: 'GET', url: '/me', headers: { cookie } });
    expect(me.json().user.completedLessons).toEqual(['napoleon-toulon']);
  });
});
