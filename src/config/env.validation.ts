import { z } from 'zod';

export const envSchema = z.object({
  NODE_ENV: z
    .enum(['development', 'production', 'test'])
    .default('development'),
  PORT: z.coerce.number().default(8080),

  // 👉 1. BỔ SUNG CÁC BIẾN CORS & CLIENT URL
  CLIENT_URL: z.string().optional().default('http://localhost:3000'),
  CORS_OTHER_URL: z.string().optional(),

  // 👉 2. BỔ SUNG BETTER_AUTH_URL (Để hết warning Better-Auth)
  BETTER_AUTH_URL: z.string().optional().default('http://localhost:8080'),

  DB_HOST: z.string().trim().min(1),
  DB_PORT: z.coerce.number().int().min(1).max(65535),
  DB_USERNAME: z.string().trim().min(1),
  DB_PASSWORD: z.string().min(1),
  DB_NAME: z.string().trim().min(1),
  DB_POOL_MAX: z.coerce.number().default(10),
  DB_POOL_MIN: z.coerce.number().default(2),
  DB_POOL_CONNECTION_TIMEOUT_MS: z.coerce.number().default(5000),
  DB_POOL_IDLE_TIMEOUT_MS: z.coerce.number().default(3000),
  BETTER_AUTH_SECRET: z
    .string()
    .min(1)
    .default(
      '1eff5193be5b9706adfab70f6066779699f7fd314e1a1740c667033704f90c32',
    ),
  JWT_ACCESS_TOKEN_EXPIRED: z.string().min(1).default('30m'),

  //Throttler
  THROTTLE_TTL_MS: z.coerce.number().default(1000),
  THROTTLE_LIMIT: z.coerce.number().default(60),
});

export type Env = z.infer<typeof envSchema>;

export function validateEnv(config: Record<string, unknown>): Env {
  const parsed = envSchema.safeParse(config);

  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((i) => `- ${i.path.join('.')} : ${i.message}`)
      .join('\n');
    throw new Error(`Invalid environment configuration: \n${issues}`);
  }

  // 👉 3. GẮN LẠI CÁC GIÁ TRỊ ĐÃ PARSE/DEFAULT VÀO process.env
  // Giúp các helper dùng process.env (như parseEnvOrigins) nhận đủ dữ liệu
  Object.assign(process.env, parsed.data);

  return parsed.data;
}
