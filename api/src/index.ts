import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { awsCredentialsProvider } from '@vercel/oidc-aws-credentials-provider';
import type { FastifyInstance } from 'fastify';
import Stripe from 'stripe';
import { buildApp } from './http.js';
import { loadConfig } from './config.js';
import { DynamoRepo, createDocClient } from './repo/dynamo.js';
import { ensureTable } from './repo/table.js';
import { StripeGateway } from './stripe/gateway.js';

const config = loadConfig();

// On Vercel the AWS integration provides a role to assume via OIDC; otherwise the default AWS credential chain is used.
const credentials = config.AWS_ROLE_ARN
  ? awsCredentialsProvider({ roleArn: config.AWS_ROLE_ARN, clientConfig: { region: config.AWS_REGION } })
  : undefined;

if (config.DYNAMO_ENDPOINT || config.DYNAMO_CREATE_TABLE === 'true') {
  const raw = new DynamoDBClient({
    region: config.AWS_REGION,
    ...(config.DYNAMO_ENDPOINT
      ? { endpoint: config.DYNAMO_ENDPOINT, credentials: { accessKeyId: 'local', secretAccessKey: 'local' } }
      : { credentials }),
  });
  if (await ensureTable(raw, config.DYNAMO_TABLE)) console.log(`Created table "${config.DYNAMO_TABLE}"`);
}

const repo = new DynamoRepo(
  createDocClient({ region: config.AWS_REGION, endpoint: config.DYNAMO_ENDPOINT, credentials }),
  config.DYNAMO_TABLE,
);
const billing = new StripeGateway(new Stripe(config.STRIPE_SECRET_KEY), config.STRIPE_WEBHOOK_SECRET);

const app: FastifyInstance = buildApp({
  repo,
  billing,
  cookieSecret: config.COOKIE_SECRET,
  webUrl: config.WEB_URL,
  secureCookies: config.WEB_URL.startsWith('https://'),
  logger: true,
});

// Not awaited on purpose: on Vercel the runtime captures the server from listen() and never
// fires the listening callback, so a top-level await here would block the module from loading.
app.listen({ port: config.PORT, host: '0.0.0.0' }).catch((err) => {
  app.log.error(err);
  process.exit(1);
});
