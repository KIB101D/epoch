import { z } from 'zod';

const schema = z.object({
  PORT: z.coerce.number().default(4000),
  COOKIE_SECRET: z.string().min(16, 'COOKIE_SECRET must be at least 16 characters'),
  WEB_URL: z.string().url().default('http://localhost:3000'),
  DYNAMO_TABLE: z.string().default('epoch'),
  DYNAMO_ENDPOINT: z.string().url().optional(),
  AWS_REGION: z.string().default('eu-central-1'),
  STRIPE_SECRET_KEY: z.string().startsWith('sk_'),
  STRIPE_WEBHOOK_SECRET: z.string().startsWith('whsec_'),
});

export type Config = z.infer<typeof schema>;

export function loadConfig(env: NodeJS.ProcessEnv = process.env): Config {
  const parsed = schema.safeParse(env);
  if (!parsed.success) {
    const issues = parsed.error.issues.map((i) => `  ${i.path.join('.')}: ${i.message}`).join('\n');
    throw new Error(`Invalid environment:\n${issues}`);
  }
  return parsed.data;
}
