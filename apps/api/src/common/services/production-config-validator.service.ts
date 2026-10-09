import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export type SecretStatus = 'CONFIGURED' | 'PLACEHOLDER' | 'MISSING';

export interface SecretReport {
  name: string;
  status: SecretStatus;
  required: boolean;
  fatalOnMissing: boolean;
  description: string;
}

export interface ProductionValidationResult {
  errors: string[];
  warnings: string[];
  report: SecretReport[];
  paymentMode: 'test' | 'live';
  isProduction: boolean;
}

@Injectable()
export class ProductionConfigValidator {
  private readonly logger = new Logger(ProductionConfigValidator.name);

  static readonly PLACEHOLDER_PATTERNS = [
    'change-me', 'change_me', 'replace', 'your_', 'your-', 'yours',
    '<your-', '<secret', 'dummy', 'founder', 'xxxxxx',
  ] as const;

  static isPlaceholder(value?: string | null): boolean {
    if (!value) return true;
    const v = value.toLowerCase();
    return ProductionConfigValidator.PLACEHOLDER_PATTERNS.some((p) => v.includes(p));
  }

  static classify(value?: string | null): SecretStatus {
    if (!value || value.trim() === '') return 'MISSING';
    if (ProductionConfigValidator.isPlaceholder(value)) return 'PLACEHOLDER';
    return 'CONFIGURED';
  }

  validate(configService: ConfigService, isProduction: boolean): ProductionValidationResult {
    const paymentMode = (configService.get<string>('PAYMENT_MODE', 'test') as 'test' | 'live');
    const result: ProductionValidationResult = {
      errors: [], warnings: [], report: [], paymentMode, isProduction,
    };

    const jwtSecret = configService.get<string>('jwt.secret', '');
    const jwtRefreshSecret = configService.get<string>('jwt.refreshSecret', '');
    if (!jwtSecret || ProductionConfigValidator.isPlaceholder(jwtSecret) || jwtSecret.length < 32) {
      result.errors.push('JWT_SECRET is invalid, missing, or still a placeholder (min 32 chars required)');
    }
    if (!jwtRefreshSecret || ProductionConfigValidator.isPlaceholder(jwtRefreshSecret) || jwtRefreshSecret.length < 32) {
      result.errors.push('JWT_REFRESH_SECRET is invalid, missing, or still a placeholder (min 32 chars required)');
    }
    result.report.push(
      this.report('JWT_SECRET', jwtSecret, true, true, 'API access token signing'),
      this.report('JWT_REFRESH_SECRET', jwtRefreshSecret, true, true, 'API refresh token signing'),
    );

    if (!isProduction) return result;

    const rpKeyId = configService.get<string>('razorpay.keyId', '');
    const rpKeySecret = configService.get<string>('razorpay.keySecret', '');
    const rpWebhookSecret = configService.get<string>('razorpay.webhookSecret', '');
    result.report.push(
      this.report('RAZORPAY_KEY_ID', rpKeyId, true, paymentMode === 'live', 'Razorpay payment gateway key'),
      this.report('RAZORPAY_KEY_SECRET', rpKeySecret, true, paymentMode === 'live', 'Razorpay payment gateway secret'),
      this.report('RAZORPAY_WEBHOOK_SECRET', rpWebhookSecret, true, paymentMode === 'live', 'Razorpay webhook signature secret'),
    );
    if (paymentMode === 'live') {
      if (!rpKeyId || rpKeyId.startsWith('rzp_test_') || ProductionConfigValidator.isPlaceholder(rpKeyId) || rpKeyId === 'rzp_live_YOUR_KEY_ID_HERE') {
        result.errors.push('RAZORPAY_KEY_ID is missing or invalid for LIVE mode (must be rzp_live_*, not a placeholder)');
      }
      if (!rpKeySecret || ProductionConfigValidator.isPlaceholder(rpKeySecret) || rpKeySecret === 'rzp_secret_YOUR_KEY_SECRET') {
        result.errors.push('RAZORPAY_KEY_SECRET is missing or still a placeholder');
      }
      if (!rpWebhookSecret || ProductionConfigValidator.isPlaceholder(rpWebhookSecret) || rpWebhookSecret === 'rzp_webhook_YOUR_WEBHOOK_SECRET') {
        result.errors.push('RAZORPAY_WEBHOOK_SECRET is missing or still a placeholder \u2014 live webhooks will be rejected');
      }
    } else {
      if (ProductionConfigValidator.isPlaceholder(rpKeyId) || ProductionConfigValidator.isPlaceholder(rpKeySecret) || ProductionConfigValidator.isPlaceholder(rpWebhookSecret)) {
        result.warnings.push('RAZORPAY_KEY_* are placeholders in test mode \u2014 payment flows will be unavailable');
      }
    }

    const awsKeyId = process.env.AWS_ACCESS_KEY_ID || '';
    const awsSecret = process.env.AWS_SECRET_ACCESS_KEY || '';
    const awsBucket = configService.get<string>('aws.bucket', '');
    result.report.push(
      this.report('AWS_ACCESS_KEY_ID', awsKeyId, false, false, 'AWS IAM access key (S3 + SES)'),
      this.report('AWS_SECRET_ACCESS_KEY', awsSecret, false, false, 'AWS IAM secret key (S3 + SES)'),
      this.report('AWS_BUCKET', awsBucket, false, false, 'S3 bucket name (default: tradingo-uploads)'),
    );
    if (!awsKeyId || !awsSecret || ProductionConfigValidator.isPlaceholder(awsKeyId) || ProductionConfigValidator.isPlaceholder(awsSecret)) {
      result.warnings.push('AWS credentials missing/placeholder \u2014 S3 uploads and SES email will fail at runtime');
    }

    const aiKeys: Array<[string, string]> = [
      ['OPENAI_API_KEY', 'OpenAI (used by OpenRouter routing)'],
      ['OPENROUTER_API_KEY', 'OpenRouter (16 AI tasks)'],
      ['GEMINI_API_KEY', 'Google Gemini (5 OCR/scoring tasks)'],
      ['GROQ_API_KEY', 'Groq (3 fast inference tasks)'],
      ['TAVILY_API_KEY', 'Tavily (live web search)'],
      ['FIRECRAWL_API_KEY', 'Firecrawl (web scraping)'],
    ];
    for (const [name, desc] of aiKeys) {
      result.report.push(this.report(name, process.env[name], false, false, desc));
    }
    const hasRealAiKey = aiKeys.some(([name]) => {
      const v = process.env[name];
      return v && !ProductionConfigValidator.isPlaceholder(v);
    });
    if (!hasRealAiKey) {
      result.warnings.push('No AI provider keys configured (or all placeholders) \u2014 AI features will return mock responses');
    }

    const emailFrom = configService.get<string>('EMAIL_FROM', '');
    result.report.push(this.report('EMAIL_FROM', emailFrom, true, false, 'Email sender identity (must be verified in SES)'));
    if (!emailFrom) {
      result.warnings.push('EMAIL_FROM not set \u2014 outgoing email disabled');
    } else {
      const fromDomain = emailFrom.split('@')[1]?.toLowerCase() || '';
      if (['example.com', 'tradingotech.com', 'yourdomain.com', 'yourdomain.in', 'localhost'].includes(fromDomain)) {
        result.warnings.push('EMAIL_FROM domain "' + fromDomain + '" is not a verified send domain \u2014 SES will reject it');
      }
    }

    const sentryDsn = configService.get<string>('sentry.dsn', '');
    const sentryEnabled = configService.get<boolean>('sentry.enabled', false);
    result.report.push(this.report('SENTRY_DSN', sentryDsn, false, false, 'Sentry project DSN'));
    result.report.push(this.report('SENTRY_ENABLED', String(sentryEnabled), false, false, 'Sentry enable flag'));
    if (sentryEnabled && (!sentryDsn || ProductionConfigValidator.isPlaceholder(sentryDsn))) {
      result.errors.push('SENTRY_ENABLED=true but SENTRY_DSN is missing or a placeholder \u2014 either set the DSN or set SENTRY_ENABLED=false');
    }

    const dbUrl = configService.get<string>('database.url', '');
    result.report.push(this.report('DATABASE_URL', dbUrl ? '***set***' : '', true, true, 'PostgreSQL connection string'));
    if (!dbUrl) {
      result.errors.push('DATABASE_URL is missing \u2014 API cannot start without a database');
    }

    const redisUrl = configService.get<string>('redis.url', '');
    result.report.push(this.report('REDIS_URL', redisUrl ? '***set***' : '', true, true, 'Redis connection string'));
    if (!redisUrl) {
      result.errors.push('REDIS_URL is missing \u2014 API cannot start without Redis (BullMQ, throttler)');
    }

    const aiVaultKey = process.env.AI_VAULT_MASTER_KEY || '';
    result.report.push(this.report('AI_VAULT_MASTER_KEY', aiVaultKey, false, false, 'AI provider API key vault encryption key'));
    if (ProductionConfigValidator.isPlaceholder(aiVaultKey) || aiVaultKey === 'tradingo-ai-vault-default-key-change-in-production!') {
      result.warnings.push('AI_VAULT_MASTER_KEY is missing or uses the default placeholder \u2014 AI key vault will not be secure');
    }

    const pgPassword = process.env.POSTGRES_PASSWORD || '';
    const redisPassword = process.env.REDIS_PASSWORD || '';
    result.report.push(
      this.report('POSTGRES_PASSWORD', pgPassword, false, false, 'PostgreSQL database password (compose-level)'),
      this.report('REDIS_PASSWORD', redisPassword, false, false, 'Redis password (compose-level)'),
    );
    if (!pgPassword || ProductionConfigValidator.isPlaceholder(pgPassword)) {
      result.warnings.push('POSTGRES_PASSWORD missing/placeholder \u2014 database connection may be insecure');
    }
    if (!redisPassword || ProductionConfigValidator.isPlaceholder(redisPassword)) {
      result.warnings.push('REDIS_PASSWORD missing/placeholder \u2014 Redis may be running without authentication');
    }

    return result;
  }

  private report(name: string, value: string | undefined | null, required: boolean, fatalOnMissing: boolean, description: string): SecretReport {
    return { name, status: ProductionConfigValidator.classify(value), required, fatalOnMissing, description };
  }

  logResult(result: ProductionValidationResult): void {
    if (result.isProduction) {
      this.logger.log('Production config validation: ' + result.errors.length + ' error(s), ' + result.warnings.length + ' warning(s) (PAYMENT_MODE=' + result.paymentMode + ')');
    } else {
      this.logger.debug('Dev config validation: ' + result.errors.length + ' error(s), ' + result.warnings.length + ' warning(s)');
    }
    for (const w of result.warnings) this.logger.warn('\u26a0 ' + w);
    for (const e of result.errors) this.logger.error('\u2717 ' + e);
  }
}
