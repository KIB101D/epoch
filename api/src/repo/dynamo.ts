import { ConditionalCheckFailedException, DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
  DeleteCommand,
  DynamoDBDocumentClient,
  GetCommand,
  PutCommand,
  QueryCommand,
  UpdateCommand,
} from '@aws-sdk/lib-dynamodb';
import type { Subscription } from '../domain/subscription.js';
import type { FunnelAnswers, Repo, User } from './types.js';

/**
 * Single-table design
 *
 * | PK              | SK            | What                                   | GSI1PK              |
 * |-----------------|---------------|----------------------------------------|---------------------|
 * | USER#<userId>   | PROFILE       | answers, email, customer, progress     | CUSTOMER#<cus_...>  |
 * | USER#<userId>   | SUBSCRIPTION  | status, plan, period end, event order  |                     |
 * | EVENT#<evt_...> | EVENT         | processed Stripe events (TTL 30 days)  |                     |
 *
 * GSI1 (GSI1PK, GSI1SK) resolves a Stripe customer id to our user in webhooks.
 */
const userPk = (userId: string) => `USER#${userId}`;
const EVENT_TTL_SECONDS = 30 * 24 * 60 * 60;

export function createDocClient(opts: { region: string; endpoint?: string }) {
  const client = new DynamoDBClient({
    region: opts.region,
    ...(opts.endpoint
      ? { endpoint: opts.endpoint, credentials: { accessKeyId: 'local', secretAccessKey: 'local' } }
      : {}),
  });
  return DynamoDBDocumentClient.from(client, { marshallOptions: { removeUndefinedValues: true } });
}

function toUser(item: Record<string, unknown>): User {
  const lessons = item.completedLessons as Set<string> | string[] | undefined;
  return {
    userId: item.userId as string,
    answers: (item.answers as FunnelAnswers | undefined) ?? null,
    email: (item.email as string | undefined) ?? null,
    stripeCustomerId: (item.stripeCustomerId as string | undefined) ?? null,
    completedLessons: lessons ? [...lessons].sort() : [],
    createdAt: item.createdAt as string,
  };
}

function isConditionFailure(err: unknown) {
  return (
    err instanceof ConditionalCheckFailedException ||
    (err as { name?: string })?.name === 'ConditionalCheckFailedException'
  );
}

export class DynamoRepo implements Repo {
  constructor(
    private readonly db: DynamoDBDocumentClient,
    private readonly table: string,
  ) {}

  async createUser(userId: string): Promise<User> {
    const item = { PK: userPk(userId), SK: 'PROFILE', userId, createdAt: new Date().toISOString() };
    await this.db.send(
      new PutCommand({ TableName: this.table, Item: item, ConditionExpression: 'attribute_not_exists(PK)' }),
    );
    return toUser(item);
  }

  async getUser(userId: string) {
    const res = await this.db.send(new GetCommand({ TableName: this.table, Key: { PK: userPk(userId), SK: 'PROFILE' } }));
    return res.Item ? toUser(res.Item) : null;
  }

  private async setProfileFields(userId: string, fields: Record<string, unknown>) {
    const names: Record<string, string> = {};
    const values: Record<string, unknown> = {};
    const sets = Object.entries(fields).map(([k, v], i) => {
      names[`#f${i}`] = k;
      values[`:v${i}`] = v;
      return `#f${i} = :v${i}`;
    });
    await this.db.send(
      new UpdateCommand({
        TableName: this.table,
        Key: { PK: userPk(userId), SK: 'PROFILE' },
        UpdateExpression: `SET ${sets.join(', ')}`,
        ConditionExpression: 'attribute_exists(PK)',
        ExpressionAttributeNames: names,
        ExpressionAttributeValues: values,
      }),
    );
  }

  saveAnswers(userId: string, answers: FunnelAnswers) {
    return this.setProfileFields(userId, { answers });
  }

  linkCustomer(userId: string, customerId: string) {
    return this.setProfileFields(userId, {
      stripeCustomerId: customerId,
      GSI1PK: `CUSTOMER#${customerId}`,
      GSI1SK: userPk(userId),
    });
  }

  setEmail(userId: string, email: string) {
    return this.setProfileFields(userId, { email });
  }

  async findUserIdByCustomer(customerId: string) {
    const res = await this.db.send(
      new QueryCommand({
        TableName: this.table,
        IndexName: 'GSI1',
        KeyConditionExpression: 'GSI1PK = :pk',
        ExpressionAttributeValues: { ':pk': `CUSTOMER#${customerId}` },
        Limit: 1,
      }),
    );
    // GSI1 projects keys only, so the user id is read from GSI1SK ("USER#<id>").
    const sk = res.Items?.[0]?.GSI1SK as string | undefined;
    return sk ? sk.slice('USER#'.length) : null;
  }

  async completeLesson(userId: string, lessonId: string) {
    // String set + ADD makes completing the same lesson twice a no-op.
    await this.db.send(
      new UpdateCommand({
        TableName: this.table,
        Key: { PK: userPk(userId), SK: 'PROFILE' },
        UpdateExpression: 'ADD completedLessons :l',
        ConditionExpression: 'attribute_exists(PK)',
        ExpressionAttributeValues: { ':l': new Set([lessonId]) },
      }),
    );
  }

  async getSubscription(userId: string) {
    const res = await this.db.send(
      new GetCommand({ TableName: this.table, Key: { PK: userPk(userId), SK: 'SUBSCRIPTION' } }),
    );
    if (!res.Item) return null;
    const { PK: _pk, SK: _sk, ...sub } = res.Item;
    return sub as Subscription;
  }

  async putSubscriptionIfNewer(sub: Subscription) {
    try {
      await this.db.send(
        new PutCommand({
          TableName: this.table,
          Item: { PK: userPk(sub.userId), SK: 'SUBSCRIPTION', ...sub },
          // Stripe does not guarantee delivery order: never overwrite a newer state with an older event.
          ConditionExpression: 'attribute_not_exists(PK) OR lastEventCreated <= :c',
          ExpressionAttributeValues: { ':c': sub.lastEventCreated },
        }),
      );
      return true;
    } catch (err) {
      if (isConditionFailure(err)) return false;
      throw err;
    }
  }

  async markPaymentIssue(userId: string, eventCreated: number) {
    try {
      await this.db.send(
        new UpdateCommand({
          TableName: this.table,
          Key: { PK: userPk(userId), SK: 'SUBSCRIPTION' },
          UpdateExpression: 'SET paymentIssue = :t',
          ConditionExpression: 'attribute_exists(PK) AND lastEventCreated <= :c',
          ExpressionAttributeValues: { ':t': true, ':c': eventCreated },
        }),
      );
    } catch (err) {
      if (!isConditionFailure(err)) throw err;
    }
  }

  async claimEvent(eventId: string, type: string) {
    try {
      await this.db.send(
        new PutCommand({
          TableName: this.table,
          Item: {
            PK: `EVENT#${eventId}`,
            SK: 'EVENT',
            type,
            processedAt: new Date().toISOString(),
            expiresAt: Math.floor(Date.now() / 1000) + EVENT_TTL_SECONDS,
          },
          ConditionExpression: 'attribute_not_exists(PK)',
        }),
      );
      return true;
    } catch (err) {
      if (isConditionFailure(err)) return false;
      throw err;
    }
  }

  async releaseEvent(eventId: string) {
    await this.db.send(new DeleteCommand({ TableName: this.table, Key: { PK: `EVENT#${eventId}`, SK: 'EVENT' } }));
  }
}
