import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import Stripe from 'stripe';
import { buildApp } from './app.js';
import { loadConfig } from './config.js';
import { DynamoRepo, createDocClient } from './repo/dynamo.js';
import { ensureTable } from './repo/table.js';
import { StripeGateway } from './stripe/gateway.js';

const config = loadConfig();

if (config.DYNAMO_ENDPOINT) {
  // Local development: create the table automatically in DynamoDB Local.
  const raw = new DynamoDBClient({
    region: config.AWS_REGION,
    endpoint: config.DYNAMO_ENDPOINT,
    credentials: { accessKeyId: 'local', secretAccessKey: 'local' },
  });
  if (await ensureTable(raw, config.DYNAMO_TABLE)) console.log(`Created table "${config.DYNAMO_TABLE}"`);
}

const repo = new DynamoRepo(
  createDocClient({ region: config.AWS_REGION, endpoint: config.DYNAMO_ENDPOINT }),
  config.DYNAMO_TABLE,
);
const billing = new StripeGateway(new Stripe(config.STRIPE_SECRET_KEY), config.STRIPE_WEBHOOK_SECRET);

const app = buildApp({
  repo,
  billing,
  cookieSecret: config.COOKIE_SECRET,
  webUrl: config.WEB_URL,
  secureCookies: config.WEB_URL.startsWith('https://'),
  logger: true,
});

await app.listen({ port: config.PORT, host: '0.0.0.0' });
