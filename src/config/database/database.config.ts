import { registerAs } from '@nestjs/config';

export const DATABASE_CONFIG = 'database';

export default registerAs(DATABASE_CONFIG, () => ({
  type: 'postgres',
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT),
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  extra: {
    max: parseInt(process.env.DB_POOL_MAX ?? '10', 10),
    min: parseInt(process.env.DB_POOL_MIN ?? '2', 10),
    connectionTimeoutMillis: parseInt(
      process.env.DB_POOL_CONNECTION_TIMEOUT_MS ?? '5000',
      10,
    ),
    idleTimeoutMillis: parseInt(
      process.env.DB_POOL_IDLE_TIMEOUT_MS ?? '30000',
      10,
    ),
  },
}));
