import 'dotenv/config';

function required(key: string, fallback?: string): string {
  const val = process.env[key] ?? fallback;
  if (val === undefined) throw new Error(`Missing env: ${key}`);
  return val;
}

export const config = {
  nodeEnv: process.env.NODE_ENV ?? 'development',
  port: parseInt(process.env.API_PORT ?? '4000', 10),
  webUrl: process.env.WEB_URL ?? 'http://localhost:3000',
  db: {
    client: process.env.DB_CLIENT ?? 'sqlite3',
    host: process.env.MYSQL_HOST ?? 'localhost',
    port: parseInt(process.env.MYSQL_PORT ?? '3306', 10),
    user: process.env.MYSQL_USER ?? 'meetmaze',
    password: process.env.MYSQL_PASSWORD ?? 'meetmaze',
    database: process.env.MYSQL_DATABASE ?? 'meetmaze',
  },
  jwt: {
    secret: process.env.JWT_SECRET ?? 'change-me',
    expiresIn: process.env.JWT_EXPIRES_IN ?? '7d',
    cookieName: process.env.COOKIE_NAME ?? 'mm_token',
  },
  holdTtlSeconds: parseInt(process.env.HOLD_TTL_SECONDS ?? '300', 10),
  checkinOpenBeforeMin: parseInt(process.env.CHECKIN_OPEN_BEFORE_MIN ?? '10', 10),
  defaultCheckinGraceMin: parseInt(process.env.DEFAULT_CHECKIN_GRACE_MIN ?? '15', 10),
  disableJobs: process.env.DISABLE_JOBS === 'true',
  enableDevStubs: process.env.ENABLE_DEV_STUBS !== 'false',
  llm: {
    provider: process.env.LLM_PROVIDER ?? 'none',
    apiKey: process.env.LLM_API_KEY ?? '',
    model: process.env.LLM_MODEL ?? '',
  },
};
