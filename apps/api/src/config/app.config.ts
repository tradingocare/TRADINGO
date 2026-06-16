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
  url: process.env.OPENSEARCH_URL || 'https://localhost:9200',
  username: process.env.OPENSEARCH_USERNAME || 'admin',
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
}));

export const clickhouseConfig = registerAs('clickhouse', () => ({
  url: process.env.CLICKHOUSE_URL || 'http://localhost:8123',
  username: process.env.CLICKHOUSE_USERNAME || 'default',
  password: process.env.CLICKHOUSE_PASSWORD || '',
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
  AWS_BUCKET: Joi.string().default('tradingo-uploads'),
  CLOUDFRONT_DOMAIN: Joi.string().allow(''),
  OPENSEARCH_URL: Joi.string().uri().required(),
  OPENSEARCH_USERNAME: Joi.string().default('admin'),
  OPENSEARCH_PASSWORD: Joi.string().allow(''),
  EMAIL_FROM: Joi.string().email().default('noreply@tradingo.io'),
  SENTRY_DSN: Joi.string().uri().allow(''),
  SENTRY_ENABLED: Joi.boolean().default(true),
  CLICKHOUSE_URL: Joi.string().uri().required(),
  CLICKHOUSE_USERNAME: Joi.string().default('default'),
  CLICKHOUSE_PASSWORD: Joi.string().allow(''),
  RAZORPAY_KEY_ID: Joi.string().allow(''),
  RAZORPAY_KEY_SECRET: Joi.string().allow(''),
  RAZORPAY_WEBHOOK_SECRET: Joi.string().allow(''),
});
