// Zod-validated environment configuration
import { z } from 'zod';
import dotenv from 'dotenv';

dotenv.config();

const configSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  API_PORT: z.coerce.number().default(4000),
  WEB_URL: z.string().default('http://localhost:3000'),
  MYSQL_HOST: z.string().default('localhost'),
  MYSQL_PORT: z.coerce.number().default(3306),
  MYSQL_USER: z.string().default('meetmaze'),
  MYSQL_PASSWORD: z.string().default('meetmaze'),
  MYSQL_DATABASE: z.string().default('meetmaze'),
  JWT_SECRET: z.string().default('change-me'),
  JWT_EXPIRES_IN: z.string().default('7d'),
  COOKIE_NAME: z.string().default('mm_token'),
  HOLD_TTL_SECONDS: z.coerce.number().default(300),
  CHECKIN_OPEN_BEFORE_MIN: z.coerce.number().default(10),
  DEFAULT_CHECKIN_GRACE_MIN: z.coerce.number().default(15),
  DISABLE_JOBS: z
    .string()
    .transform((v) => v === 'true')
    .default('false'),
  ENABLE_DEV_STUBS: z
    .string()
    .transform((v) => v === 'true')
    .default('true'),
  LLM_PROVIDER: z.enum(['none', 'gemini', 'openai', 'anthropic']).default('none'),
  LLM_API_KEY: z.string().default(''),
  LLM_MODEL: z.string().default(''),
});

export type Config = z.infer<typeof configSchema>;

const parsed = configSchema.safeParse(process.env);
if (!parsed.success) {
  console.error('❌ Invalid environment variables:', parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const config: Config = parsed.data;
