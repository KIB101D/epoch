# Epoch

Interactive history in five-minute stories: 15 stories across 3 eras, each a chain of 2 to 3 decisions (6 free, 9 premium). A quiz funnel builds a personal path, a paywall sells a Stripe subscription, and webhooks turn payments into access.

![stack](https://img.shields.io/badge/Fastify-TypeScript-black) ![stack](https://img.shields.io/badge/DynamoDB-single--table-blue) ![stack](https://img.shields.io/badge/Stripe-subscriptions-635bff) ![stack](https://img.shields.io/badge/Next.js-App%20Router-black)

```
Landing → Quiz (era · goal · minutes) → Personal plan + paywall → Stripe Checkout
                                                                       │
        Library ← premium unlocked ← DynamoDB ← verified webhook ←─────┘
```

## What it shows

- **Subscriptions end to end**: Stripe Checkout (monthly and yearly), Customer Portal for cancel and card changes, access driven only by webhooks.
- **Reliable webhook handling**: signature verification on the raw body, idempotency per event id, protection against out-of-order delivery, and release-on-failure so Stripe retries can succeed.
- **DynamoDB single-table design** with a GSI to resolve Stripe customers, conditional writes, string sets and TTL.
- **Server-side access control**: premium lesson content is never sent to a client without an active subscription (`402 premium_required`).
- **A quiz funnel** with a personal plan and a paywall, built with Next.js App Router and Tailwind.

## Architecture

```
web/  Next.js App Router + Tailwind      /api/* is proxied to the API (same-origin cookies)
api/  Fastify + TypeScript
  src/http.ts              routes, signed anonymous session cookie, error handling
  src/stripe/gateway.ts    BillingGateway interface + Stripe implementation
  src/stripe/webhook.ts    event → state (idempotent, order-safe, retry-safe)
  src/repo/types.ts        storage port
  src/repo/dynamo.ts       DynamoDB single-table implementation
  src/repo/memory.ts       in-memory implementation for unit tests
  src/domain/subscription  who gets access, plan ↔ price lookup keys
  src/content/lessons.ts   stories → scenes → decisions (one historical choice per scene)
```

Routes depend on two interfaces, `Repo` and `BillingGateway`. That keeps the business logic testable without network calls, and switching the payment provider (for example to Solidgate) means writing one new gateway, not touching routes.

### DynamoDB single-table design

| PK              | SK             | Holds                                              | GSI1PK               |
|-----------------|----------------|----------------------------------------------------|----------------------|
| `USER#<id>`     | `PROFILE`      | quiz answers, email, Stripe customer, progress set | `CUSTOMER#<cus_...>` |
| `USER#<id>`     | `SUBSCRIPTION` | status, plan, period end, `lastEventCreated`       |                      |
| `EVENT#<evt_>`  | `EVENT`        | processed Stripe events, expire after 30 days (TTL)|                      |

Access patterns:

| Need                                   | How                                         |
|----------------------------------------|---------------------------------------------|
| Load a user and their subscription     | `GetItem` on `USER#<id>`                    |
| Map a webhook's customer to a user     | `Query` GSI1 on `CUSTOMER#<cus_...>`        |
| Process each Stripe event once         | `PutItem` with `attribute_not_exists(PK)`   |
| Never apply an older event over a newer| `PutItem` with `lastEventCreated <= :c`     |
| Mark a lesson complete twice safely    | `ADD` to a string set                       |

### Payment flow

1. On the first checkout the API creates a Stripe customer tagged with our `userId` and stores the mapping, so every later webhook can be resolved, whatever order events arrive in.
2. The user pays in Stripe Checkout and is redirected to `/success`.
3. The redirect does **not** grant access. `/success` polls `/me` while the webhook arrives.
4. `customer.subscription.created / updated / deleted` write the subscription state. `invoice.payment_failed` flags a payment issue.
5. Access rule: `active`, `trialing` and `past_due` (grace period while Stripe retries) get premium. Everything else does not.

## Run it

Requirements: Node 22, Docker (for DynamoDB Local), a free Stripe account, and the [Stripe CLI](https://docs.stripe.com/stripe-cli).

```bash
# 1. DynamoDB Local
docker compose up -d dynamodb

# 2. API
cd api
cp .env.example .env             # add your sk_test_ key
npm install
npm run stripe:setup             # creates the product and monthly/yearly prices (by lookup key)
stripe listen \
  --events checkout.session.completed,customer.subscription.created,customer.subscription.updated,customer.subscription.deleted,invoice.payment_failed \
  --forward-to localhost:4000/webhooks/stripe   # copy the whsec_ into .env
npm run dev                      # creates the table on first start

# 3. Web (new terminal)
cd web
cp .env.example .env.local
npm install
npm run dev                      # http://localhost:3000
```

Pay with the test card `4242 4242 4242 4242`, any future date and any CVC. To see the payment-issue state, run `stripe trigger invoice.payment_failed` or cancel and renew from the Customer Portal.

### Quick demo without any keys

```bash
cd api && npm run demo           # in-memory store, fake checkout URL
cd web && npm run dev
# after pressing "Start Premium", simulate Stripe confirming the payment:
cd api && npm run demo:pay
```

## Tests

```bash
cd api && npm test
```

- `webhook.test.ts`: activation, duplicate delivery, out-of-order events, grace period on `past_due`, payment failure, cancel at period end, unknown customers, release on failure.
- `routes.test.ts`: the full flow through HTTP with **real Stripe signature verification**: quiz → session cookie → checkout → signed webhook → premium lesson unlocked; tampered cookies and forged signatures rejected.
- `content.test.ts`: content invariants (five chapters per era, first two free, exactly one historical choice per scene).
- `dynamo.test.ts`: the DynamoDB repository against a DynamoDB-compatible server (DynamoDB Local in CI, an in-process emulator otherwise): GSI lookup, conditional writes, idempotency, string sets.

CI (GitHub Actions) runs typecheck, tests against DynamoDB Local, and builds both apps.

## Deployment

The live demo runs on free tiers, as two Vercel projects from this repo plus DynamoDB:

| Part     | Where                                   | Notes |
|----------|-----------------------------------------|-------|
| Web      | Vercel, root directory `web`            | `API_URL` points at the API; `/api/*` is proxied, so cookies stay first-party |
| API      | Vercel, root directory `api`            | Fastify runs as a Vercel Function (zero config, entry `src/index.ts`) |
| Database | DynamoDB on-demand, `eu-central-1`      | the API creates the table and TTL on first start |
| Payments | Stripe test mode                        | webhook endpoint `https://<api>/webhooks/stripe` |

The API's AWS credentials belong to an IAM user limited to this one table and its index: [`infra/aws-iam-policy.json`](infra/aws-iam-policy.json).

API environment in production: `COOKIE_SECRET`, `WEB_URL` (the Vercel URL, used for Stripe redirects and the `Secure` cookie flag), `DYNAMO_TABLE`, `AWS_REGION`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`. `DYNAMO_ENDPOINT` is left unset, so the SDK talks to real DynamoDB.

The API also ships as a Docker image (`api/Dockerfile`), so the same code runs on Render, Fly or ECS Fargate behind an ALB, with secrets from Secrets Manager and a task role instead of access keys.

## What I would do next

- Real accounts (magic link) so a subscription can be restored on a new device.
- Mobile store subscriptions through a layer like Adapty, writing into the same `SUBSCRIPTION` item.
- Funnel analytics: quiz completion, paywall view → checkout → paid conversion per era.
- A dead-letter path and alerting for webhooks that keep failing.
