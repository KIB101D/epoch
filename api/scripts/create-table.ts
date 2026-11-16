/** Creates the DynamoDB table (and GSI1) if it does not exist. Uses DYNAMO_ENDPOINT when set. */
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { ensureTable } from '../src/repo/table.js';

const table = process.env.DYNAMO_TABLE ?? 'epoch';
const endpoint = process.env.DYNAMO_ENDPOINT;
const client = new DynamoDBClient({
  region: process.env.AWS_REGION ?? 'eu-central-1',
  ...(endpoint ? { endpoint, credentials: { accessKeyId: 'local', secretAccessKey: 'local' } } : {}),
});

const created = await ensureTable(client, table);
console.log(created ? `Created table "${table}"` : `Table "${table}" already exists`);
