import {
  CreateTableCommand,
  DescribeTableCommand,
  ResourceNotFoundException,
  UpdateTimeToLiveCommand,
  type DynamoDBClient,
} from '@aws-sdk/client-dynamodb';

/** Creates the single table with GSI1 if it does not exist yet. Safe to run repeatedly. */
export async function ensureTable(client: DynamoDBClient, table: string) {
  try {
    await client.send(new DescribeTableCommand({ TableName: table }));
    return false;
  } catch (err) {
    if (!(err instanceof ResourceNotFoundException) && (err as { name?: string }).name !== 'ResourceNotFoundException') {
      throw err;
    }
  }

  await client.send(
    new CreateTableCommand({
      TableName: table,
      BillingMode: 'PAY_PER_REQUEST',
      AttributeDefinitions: [
        { AttributeName: 'PK', AttributeType: 'S' },
        { AttributeName: 'SK', AttributeType: 'S' },
        { AttributeName: 'GSI1PK', AttributeType: 'S' },
        { AttributeName: 'GSI1SK', AttributeType: 'S' },
      ],
      KeySchema: [
        { AttributeName: 'PK', KeyType: 'HASH' },
        { AttributeName: 'SK', KeyType: 'RANGE' },
      ],
      GlobalSecondaryIndexes: [
        {
          IndexName: 'GSI1',
          KeySchema: [
            { AttributeName: 'GSI1PK', KeyType: 'HASH' },
            { AttributeName: 'GSI1SK', KeyType: 'RANGE' },
          ],
          Projection: { ProjectionType: 'KEYS_ONLY' },
        },
      ],
    }),
  );

  // Wait until ACTIVE (DynamoDB Local is instant, real AWS takes a few seconds).
  for (let i = 0; i < 30; i++) {
    const res = await client.send(new DescribeTableCommand({ TableName: table }));
    if (res.Table?.TableStatus === 'ACTIVE') break;
    await new Promise((r) => setTimeout(r, 500));
  }

  try {
    await client.send(
      new UpdateTimeToLiveCommand({
        TableName: table,
        TimeToLiveSpecification: { Enabled: true, AttributeName: 'expiresAt' },
      }),
    );
  } catch {
    // Some local emulators do not support TTL; processed events then simply stay.
  }
  return true;
}
