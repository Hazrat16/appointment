import { z } from 'zod';
import logger from '../utils/logger';

const envSchema = z.object({
  PORT: z.coerce.number().int().positive().default(5000),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  MONGODB_URI: z.string().min(1, 'MONGODB_URI is required'),
  JWT_SECRET: z.string().min(1, 'JWT_SECRET is required'),
  JWT_EXPIRE: z.string().default('7d'),
  FRONTEND_URL: z.string().optional(),
  TRUST_PROXY: z.string().optional(),
  LISTEN_HOST: z.string().default('0.0.0.0'),
});

function loadEnv() {
  const parsed = envSchema.safeParse(process.env);

  if (!parsed.success) {
    logger.error({ issues: parsed.error.issues }, 'Invalid environment configuration');
    process.exit(1);
  }

  return parsed.data;
}

export const env = loadEnv();
