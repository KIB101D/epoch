import { randomUUID } from 'node:crypto';
import cookie from '@fastify/cookie';
import Fastify, { type FastifyReply, type FastifyRequest } from 'fastify';
import { z } from 'zod';
import { ERAS, LESSONS } from './content/lessons.js';
import { hasPremiumAccess } from './domain/subscription.js';
import type { Repo, User } from './repo/types.js';
import type { BillingGateway } from './stripe/gateway.js';
import { handleStripeEvent } from './stripe/webhook.js';

export interface AppDeps {
  repo: Repo;
  billing: BillingGateway;
  cookieSecret: string;
  webUrl: string;
  secureCookies?: boolean;
  logger?: boolean;
}

const COOKIE = 'epoch_uid';

const answersSchema = z.object({
  era: z.enum(['rome', 'egypt', 'napoleon']),
  goal: z.enum(['curiosity', 'study', 'kids']),
  minutesPerDay: z.union([z.literal(5), z.literal(10), z.literal(15)]),
});
const checkoutSchema = z.object({ plan: z.enum(['monthly', 'yearly']) });

class HttpError extends Error {
  constructor(
    readonly statusCode: number,
    readonly code: string,
    message: string,
  ) {
    super(message);
  }
}

export function buildApp(deps: AppDeps) {
  const app = Fastify({ logger: deps.logger ?? false });
  app.register(cookie, { secret: deps.cookieSecret });

  app.setErrorHandler((err, _req, reply) => {
    if (err instanceof HttpError) return reply.status(err.statusCode).send({ error: err.code, message: err.message });
    if (err instanceof z.ZodError) return reply.status(400).send({ error: 'validation_error', issues: err.issues });
    app.log.error(err);
    return reply.status(500).send({ error: 'internal_error', message: 'Something went wrong' });
  });

  /** Reads the signed anonymous-session cookie. Returns null if missing or tampered with. */
  async function currentUser(req: FastifyRequest): Promise<User | null> {
    const raw = req.cookies[COOKIE];
    if (!raw) return null;
    const unsigned = req.unsignCookie(raw);
    if (!unsigned.valid || !unsigned.value) return null;
    return deps.repo.getUser(unsigned.value);
  }

  async function requireUser(req: FastifyRequest) {
    const user = await currentUser(req);
    if (!user) throw new HttpError(401, 'no_session', 'Start the quiz first');
    return user;
  }

  function setSession(reply: FastifyReply, userId: string) {
    reply.setCookie(COOKIE, userId, {
      signed: true,
      httpOnly: true,
      sameSite: 'lax',
      secure: deps.secureCookies ?? false,
      path: '/',
      maxAge: 60 * 60 * 24 * 365,
    });
  }

  app.get('/health', async () => ({ ok: true }));

  // Quiz funnel: creates the anonymous user on first submit and stores the answers.
  app.post('/funnel', async (req, reply) => {
    const answers = answersSchema.parse(req.body);
    let user = await currentUser(req);
    if (!user) {
      user = await deps.repo.createUser(randomUUID());
      setSession(reply, user.userId);
    }
    await deps.repo.saveAnswers(user.userId, answers);
    return { userId: user.userId, plan: buildPlan(answers.era, answers.minutesPerDay) };
  });

  app.get('/me', async (req) => {
    const user = await requireUser(req);
    const subscription = await deps.repo.getSubscription(user.userId);
    return {
      user: {
        answers: user.answers,
        email: user.email,
        completedLessons: user.completedLessons,
      },
      plan: user.answers ? buildPlan(user.answers.era, user.answers.minutesPerDay) : null,
      subscription: subscription && {
        status: subscription.status,
        plan: subscription.plan,
        currentPeriodEnd: subscription.currentPeriodEnd,
        cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
        paymentIssue: subscription.paymentIssue,
      },
      premium: hasPremiumAccess(subscription),
    };
  });

  app.get('/lessons', async (req) => {
    const user = await currentUser(req);
    const premium = user ? hasPremiumAccess(await deps.repo.getSubscription(user.userId)) : false;
    const done = new Set(user?.completedLessons ?? []);
    return {
      eras: ERAS,
      lessons: LESSONS.map(({ body: _b, decision: _d, ...meta }) => ({
        ...meta,
        locked: !meta.free && !premium,
        completed: done.has(meta.id),
      })),
    };
  });

  // Access is decided here, on the server. The frontend only renders what it is allowed to receive.
  app.get<{ Params: { id: string } }>('/lessons/:id', async (req) => {
    const lesson = LESSONS.find((l) => l.id === req.params.id);
    if (!lesson) throw new HttpError(404, 'not_found', 'Lesson not found');
    if (!lesson.free) {
      const user = await currentUser(req);
      const premium = user ? hasPremiumAccess(await deps.repo.getSubscription(user.userId)) : false;
      if (!premium) throw new HttpError(402, 'premium_required', 'This lesson is part of Epoch Premium');
    }
    return lesson;
  });

  app.post<{ Params: { id: string } }>('/lessons/:id/complete', async (req) => {
    const user = await requireUser(req);
    const lesson = LESSONS.find((l) => l.id === req.params.id);
    if (!lesson) throw new HttpError(404, 'not_found', 'Lesson not found');
    if (!lesson.free && !hasPremiumAccess(await deps.repo.getSubscription(user.userId))) {
      throw new HttpError(402, 'premium_required', 'This lesson is part of Epoch Premium');
    }
    await deps.repo.completeLesson(user.userId, lesson.id);
    return { ok: true };
  });

  app.get('/billing/prices', async () => ({ prices: await deps.billing.listPrices() }));

  app.post('/billing/checkout', async (req) => {
    const { plan } = checkoutSchema.parse(req.body);
    const user = await requireUser(req);
    if (hasPremiumAccess(await deps.repo.getSubscription(user.userId))) {
      throw new HttpError(409, 'already_subscribed', 'You already have Epoch Premium');
    }
    let customerId = user.stripeCustomerId;
    if (!customerId) {
      customerId = await deps.billing.createCustomer(user.userId);
      await deps.repo.linkCustomer(user.userId, customerId);
    }
    const url = await deps.billing.createCheckoutUrl({
      customerId,
      userId: user.userId,
      plan,
      successUrl: `${deps.webUrl}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancelUrl: `${deps.webUrl}/plan?canceled=1`,
    });
    return { url };
  });

  app.post('/billing/portal', async (req) => {
    const user = await requireUser(req);
    if (!user.stripeCustomerId) throw new HttpError(400, 'no_customer', 'No billing account yet');
    return { url: await deps.billing.createPortalUrl(user.stripeCustomerId, `${deps.webUrl}/account`) };
  });

  // Webhooks need the exact raw body for signature verification, so this scope parses JSON as a Buffer.
  app.register(async (scope) => {
    scope.addContentTypeParser('application/json', { parseAs: 'buffer' }, (_req, body, done) => done(null, body));
    scope.post('/webhooks/stripe', async (req, reply) => {
      const signature = req.headers['stripe-signature'];
      if (typeof signature !== 'string') throw new HttpError(400, 'missing_signature', 'Missing Stripe-Signature header');
      let event;
      try {
        event = deps.billing.verifyWebhook(req.body as Buffer, signature);
      } catch {
        throw new HttpError(400, 'invalid_signature', 'Webhook signature verification failed');
      }
      const outcome = await handleStripeEvent(event, deps.repo);
      req.log.info({ eventId: event.id, type: event.type, outcome }, 'stripe webhook');
      return reply.send({ received: true, outcome });
    });
  });

  return app;
}

function buildPlan(era: keyof typeof ERAS, minutesPerDay: number) {
  const lessons = LESSONS.filter((l) => l.era === era).sort((a, b) => a.order - b.order);
  const totalMinutes = lessons.reduce((sum, l) => sum + l.minutes, 0);
  return {
    era,
    eraTitle: ERAS[era].title,
    lessons: lessons.map((l) => ({ id: l.id, title: l.title, year: l.year, free: l.free })),
    days: Math.max(1, Math.ceil(totalMinutes / minutesPerDay)),
  };
}
