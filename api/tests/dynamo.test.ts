import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import type { AddressInfo } from 'node:net';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { DynamoRepo, createDocClient } from '../src/repo/dynamo.js';
import { ensureTable } from '../src/repo/table.js';
import { handleStripeEvent } from '../src/stripe/webhook.js';
import { event, subscriptionObject } from './helpers.js';

/**
 * Runs the real DynamoDB repository against a DynamoDB-compatible server:
 * - DYNAMO_ENDPOINT if set (DynamoDB Local in docker compose / CI),
 * - otherwise an in-process dynalite emulator, so the suite runs anywhere.
 */
let close = async () => {};
let repo: DynamoRepo;

beforeAll(async () => {
  let endpoint = process.env.DYNAMO_TEST_ENDPOINT;
  if (!endpoint) {
    const { default: dynalite } = await import('dynalite');
    const server = dynalite({ createTableMs: 0, deleteTableMs: 0, updateTableMs: 0 });
    await new Promise<void>((resolve) => server.listen(0, resolve));
    endpoint = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
    close = () => new Promise((resolve) => server.close(() => resolve()));
  }
  const table = `epoch_test_${Date.now()}`;
  const raw = new DynamoDBClient({
    region: 'eu-central-1',
    endpoint,
    credentials: { accessKeyId: 'local', secretAccessKey: 'local' },
  });
  await ensureTable(raw, table);
  repo = new DynamoRepo(createDocClient({ region: 'eu-central-1', endpoint }), table);
});

afterAll(() => close());

describe('DynamoRepo (single-table)', () => {
  it('stores users and finds them by Stripe customer via GSI1', async () => {
    await repo.createUser('u-gsi');
    await repo.saveAnswers('u-gsi', { era: 'rome', goal: 'study', minutesPerDay: 5 });
    await repo.linkCustomer('u-gsi', 'cus_gsi');
    expect(await repo.findUserIdByCustomer('cus_gsi')).toBe('u-gsi');
    expect((await repo.getUser('u-gsi'))?.answers).toEqual({ era: 'rome', goal: 'study', minutesPerDay: 5 });
  });

  it('does not create the same user twice', async () => {
    await repo.createUser('u-once');
    await expect(repo.createUser('u-once')).rejects.toThrow();
  });

  it('claims each Stripe event id once', async () => {
    expect(await repo.claimEvent('evt_once', 'test')).toBe(true);
    expect(await repo.claimEvent('evt_once', 'test')).toBe(false);
    await repo.releaseEvent('evt_once');
    expect(await repo.claimEvent('evt_once', 'test')).toBe(true);
  });

  it('applies subscription events in order, ignoring stale ones', async () => {
    await repo.createUser('u-sub');
    await repo.linkCustomer('u-sub', 'cus_sub');
    await handleStripeEvent(
      event('customer.subscription.updated', subscriptionObject({ customer: 'cus_sub', status: 'canceled' }), { created: 200 }),
      repo,
    );
    await handleStripeEvent(
      event('customer.subscription.created', subscriptionObject({ customer: 'cus_sub', status: 'active' }), { created: 100 }),
      repo,
    );
    expect((await repo.getSubscription('u-sub'))?.status).toBe('canceled');
  });

  it('records lesson progress as a set', async () => {
    await repo.createUser('u-progress');
    await repo.completeLesson('u-progress', 'rome-rubicon');
    await repo.completeLesson('u-progress', 'rome-rubicon');
    await repo.completeLesson('u-progress', 'rome-ides');
    expect((await repo.getUser('u-progress'))?.completedLessons).toEqual(['rome-ides', 'rome-rubicon']);
  });
});
