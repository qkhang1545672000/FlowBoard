import { registerAs } from '@nestjs/config';
import { parseEnvOrigins } from 'src/shared/utils/parse-env-origins';

export const APP_CONFIG = 'app';

export default registerAs(APP_CONFIG, () => ({
  port: parseInt(process.env.PORT ?? '8080', 10),
  corsOrigins: parseEnvOrigins(
    process.env.CLIENT_URL,
    process.env.CORS_OTHER_URL,
  ),
}));
