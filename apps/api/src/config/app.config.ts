import { registerAs } from '@nestjs/config';
import * as Joi from 'joi';

export const appConfig = registerAs('app', () => ({
  port: parseInt(process.env.PORT!, 10) || 3001,
  nodeEnv: process.env.NODE_ENV || 'development',
}));

export const databaseConfig = registerAs('database', () => ({
  url: process.env.DATABASE_URL!,
}));

export const redisConfig = registerAs('redis', () => ({
  url: process.env.REDIS_URL || 'redis://localhost:6379/0',
}));

export const jwtConfig = registerAs('jwt', () => ({
  secret: process.env.JWT_SECRET!,
  refreshSecret: process.env.JWT_REFRESH_SECRET!,
  expiresIn: process.env.JWT_EXPIRES_IN || '15m',
  refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
}));

export const awsConfig = registerAs('aws', () => ({
  region: process.env.AWS_REGION || 'us-east-1',
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  bucket: process.env.AWS_BUCKET || 'tradingo-uploads',
  cloudfrontDomain: process.env.CLOUDFRONT_DOMAIN || '',
}));

export const opensearchConfig = registerAs('opensearch', () => ({
  // Optional infrastructure: when no endpoint is configured the search feature is
  // explicitly disabled (no client is constructed) instead of pointing at a fake
  // local endpoint. See DEGRADATION_MATRIX (dependency: 'opensearch').
  url: process.env.OPENSEARCH_URL || '',
  username: process.env.OPENSEARCH_USERNAME || '',
  password: process.env.OPENSEARCH_PASSWORD || '',
  rejectUnauthorized: process.env.OPENSEARCH_REJECT_UNAUTHORIZED !== 'false',
}));

export const sentryConfig = registerAs('sentry', () => ({
  dsn: process.env.SENTRY_DSN || '',
  enabled: process.env.SENTRY_ENABLED === 'true',
}));

export const razorpayConfig = registerAs('razorpay', () => ({
  keyId: process.env.RAZORPAY_KEY_ID || '',
  keySecret: process.env.RAZORPAY_KEY_SECRET || '',
  webhookSecret: process.env.RAZORPAY_WEBHOOK_SECRET || '',
  accountNumber: process.env.RAZORPAY_ACCOUNT_NUMBER || '',
  mode: process.env.PAYMENT_MODE || 'test',
}));

export const clickhouseConfig = registerAs('clickhouse', () => ({
  // Optional infrastructure: absent URL => the analytics client is not created and
  // the feature degrades to Prisma aggregations (DEGRADATION_MATRIX 'clickhouse').
  url: process.env.CLICKHOUSE_URL || '',
  username: process.env.CLICKHOUSE_USERNAME || 'default',
  password: process.env.CLICKHOUSE_PASSWORD || '',
}));

// P0-4 remediation (auth-doc final audit): ClamAvService reads
// malware.clamavHost/clamavPort/scanTimeout, but this namespace was never
// registered — every environment silently fell back to localhost:3310 even
// though docker-compose maps CLAMAV_HOST=clamav. Registering the namespace
// makes the compose env vars effective; defaults stay localhost for bare
// local runs (a running local clamav container is still reachable).
export const malwareConfig = registerAs('malware', () => ({
  clamavHost: process.env.CLAMAV_HOST || 'localhost',
  clamavPort: parseInt(process.env.CLAMAV_PORT || '3310', 10),
  scanTimeout: (parseInt(process.env.CLAMAV_TIMEOUT || '30', 10)) * 1000,
}));

export const validationSchema = Joi.object({
  PORT: Joi.number().default(3001),
  NODE_ENV: Joi.string().valid('development', 'production', 'test').default('development'),
  DATABASE_URL: Joi.string().uri().required(),
  REDIS_URL: Joi.string().uri().required(),
  JWT_SECRET: Joi.string().min(32).required(),
  JWT_REFRESH_SECRET: Joi.string().min(32).required(),
  JWT_EXPIRES_IN: Joi.string().default('15m'),
  JWT_REFRESH_EXPIRES_IN: Joi.string().default('7d'),
  AWS_REGION: Joi.string().default('us-east-1'),
  AWS_ACCESS_KEY_ID: Joi.string().allow(''),
  AWS_SECRET_ACCESS_KEY: Joi.string().allow(''),
  // AWS storage is future-only: the bucket name is not a secret and the service
  // degrades to "skipped" when S3 is unreachable (DEGRADATION_MATRIX 's3-storage').
  // It must never be a boot-blocking requirement for the current release.
  AWS_BUCKET: Joi.string().allow('').default('tradingo-uploads'),
  CLOUDFRONT_DOMAIN: Joi.string().allow(''),
  // Optional infrastructure: an absent/empty endpoint disables the feature.
  OPENSEARCH_URL: Joi.string().uri().allow('').optional(),
  OPENSEARCH_USERNAME: Joi.string().allow('').optional(),
  OPENSEARCH_PASSWORD: Joi.string().allow(''),
  EMAIL_FROM: Joi.string().email().default('noreply@tradingotech.com'),
  SENTRY_DSN: Joi.string().uri().allow(''),
  SENTRY_ENABLED: Joi.boolean().default(false),
  CLICKHOUSE_URL: Joi.string().uri().allow('').optional(),
  CLICKHOUSE_USERNAME: Joi.string().allow('').default('default'),
  CLICKHOUSE_PASSWORD: Joi.string().allow(''),
  RAZORPAY_KEY_ID: Joi.string().allow(''),
  RAZORPAY_KEY_SECRET: Joi.string().allow(''),
  RAZORPAY_WEBHOOK_SECRET: Joi.string().allow(''),
  PAYMENT_MODE: Joi.string().valid('test', 'live').default('test'),
  FEATURE_REFERRAL_UI: Joi.boolean().default(false),
  FEATURE_TRACKING: Joi.boolean().default(false),
  FEATURE_GA4: Joi.boolean().default(false),
  FEATURE_PUBLIC_CRM: Joi.boolean().default(false),
  FEATURE_LEAD_CAPTURE: Joi.boolean().default(false),
  FEATURE_SHARE_LINKS: Joi.boolean().default(false),
  GA4_MEASUREMENT_ID: Joi.string().allow(''),
  GA4_API_SECRET: Joi.string().allow(''),
  TURNSTILE_SECRET_KEY: Joi.string().allow(''),
  TURNSTILE_SITE_KEY: Joi.string().allow(''),
  PAN_VERIFY_API_URL: Joi.string().uri().allow(''),
  PAN_VERIFY_API_KEY: Joi.string().allow(''),
  GST_VERIFY_API_URL: Joi.string().uri().allow(''),
  GST_VERIFY_API_KEY: Joi.string().allow(''),
  EMAIL_PROVIDER: Joi.string().valid('ses', 'resend').default('ses'),
  RESEND_API_KEY: Joi.string().allow(''),
  RESEND_FROM: Joi.string().email().allow(''),
});
