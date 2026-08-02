import helmet from '@fastify/helmet';
import csrf from '@fastify/csrf-protection';
import cookie from '@fastify/cookie';
import compress from '@fastify/compress';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { collectDefaultMetrics, Registry } from 'prom-client';
import { createServer } from 'http';
import * as Sentry from '@sentry/nestjs';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { PrismaClientExceptionFilter } from './common/filters/prisma-client-exception.filter';
import { SentryInterceptor } from './common/interceptors/sentry.interceptor';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { MetricsInterceptor } from './common/interceptors/metrics.interceptor';
import { RedisIoAdapter } from './modules/chat/redis-io-adapter';
import { PinoLoggerService } from './common/services/pino-logger.service';
import { bootstrapTracing } from './tracing';
import { MetricsRegistryService } from './common/services/metrics-registry.service';
import { BusinessMetricsService } from './common/services/business-metrics.service';
import { QueueMetricsService } from './common/services/queue-metrics.service';
import { RedisService } from './common/services/redis.service';
import { PrismaService } from './prisma/prisma.service';
import { logger, createRequestContext } from './common/logger';

async function bootstrap() {
  // Global process-level error handlers — prevent Node.js crashes on unhandled rejections
  process.on('unhandledRejection', (reason: unknown) => {
    logger.error({ err: reason }, 'UNHANDLED PROMISE REJECTION — application will continue, but investigate the cause');
    Sentry.captureException(reason instanceof Error ? reason : new Error(String(reason)));
  });
  process.on('uncaughtException', (error: Error) => {
    logger.error({ err: error }, 'UNCAUGHT EXCEPTION — application may become unstable');
    Sentry.captureException(error);
    // Graceful shutdown — give time for cleanup
    setTimeout(() => process.exit(1), 3000).unref();
  });

  // Attempt OpenTelemetry bootstrap (no-op if OTEL packages not installed)
  await bootstrapTracing();

  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter({
      logger: {
        level: process.env.LOG_LEVEL || (process.env.NODE_ENV === 'production' ? 'info' : 'debug'),
        transport: process.env.NODE_ENV !== 'production'
          ? { target: 'pino-pretty', options: { colorize: true, translateTime: 'SYS:standard' } }
          : undefined,
      },
      bodyLimit: 100 * 1024 * 1024,
    }),
  );

  app.enableShutdownHooks();

  // Replace NestJS ConsoleLogger with Pino (structured JSON in production)
  app.useLogger(new PinoLoggerService());

  const configService = app.get(ConfigService);

  // Validate JWT secrets are not placeholders
  const jwtSecret = configService.get<string>('jwt.secret', '');
  const jwtRefreshSecret = configService.get<string>('jwt.refreshSecret', '');
  if (!jwtSecret || jwtSecret.startsWith('change-me') || jwtSecret.length < 32) {
    throw new Error('JWT_SECRET is invalid, missing, or still a placeholder. Set a strong 64-char random secret in your .env file.');
  }
  if (!jwtRefreshSecret || jwtRefreshSecret.startsWith('change-me') || jwtRefreshSecret.length < 32) {
    throw new Error('JWT_REFRESH_SECRET is invalid, missing, or still a placeholder. Set a strong 64-char random secret in your .env file.');
  }

  const isProduction = configService.get<string>('NODE_ENV') === 'production';

  // Production credential validation
  if (isProduction) {
    const errors: string[] = [];

    // AWS credentials (SES + S3) — warn only, not fatal (supports deployments without email)
    if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
      logger.warn('AWS_ACCESS_KEY_ID / AWS_SECRET_ACCESS_KEY not set — SES email delivery disabled');
    }

    // Razorpay live keys
    const rpKeyId = configService.get<string>('razorpay.keyId', '');
    if (!rpKeyId || rpKeyId.includes('<replace>') || rpKeyId === 'rzp_test_xxxxxxxxxxxx') {
      errors.push('RAZORPAY_KEY_ID is missing or still a placeholder. Set a valid live key (rzp_live_*)');
    }
    const rpKeySecret = configService.get<string>('razorpay.keySecret', '');
    if (!rpKeySecret || rpKeySecret.includes('<replace>') || rpKeySecret === 'your_razorpay_secret') {
      errors.push('RAZORPAY_KEY_SECRET is missing or still a placeholder');
    }
    const rpWebhookSecret = configService.get<string>('razorpay.webhookSecret', '');
    if (!rpWebhookSecret || rpWebhookSecret.includes('<replace>') || rpWebhookSecret === 'your_webhook_secret') {
      errors.push('RAZORPAY_WEBHOOK_SECRET is missing or still a placeholder — webhooks will fail');
    }

    // Email from address
    const emailFrom = configService.get<string>('EMAIL_FROM', '');
    if (!emailFrom) {
      errors.push('EMAIL_FROM must be set in production');
    }

    // Sentry DSN (warning only)
    if (!process.env.SENTRY_DSN) {
      logger.warn('SENTRY_DSN is not set — error reporting disabled. Set a valid DSN for production monitoring.');
    }

    // AI provider keys (warn only)
    const aiKeys = ['OPENAI_API_KEY', 'OPENROUTER_API_KEY', 'GEMINI_API_KEY', 'GROQ_API_KEY', 'TAVILY_API_KEY', 'FIRECRAWL_API_KEY'];
    const hasAiKey = aiKeys.some((k) => process.env[k] && !process.env[k]!.startsWith('YOUR_'));
    if (!hasAiKey) {
      logger.warn('No AI provider keys configured — AI features will be unavailable. Set at least one of: ' + aiKeys.join(', '));
    }

    if (errors.length > 0) {
      logger.error('Production environment validation failed:');
      for (const err of errors) {
        logger.error(`  ✗ ${err}`);
      }
      throw new Error(`Production environment validation failed:\n  ${errors.join('\n  ')}`);
    }

    logger.info('Production environment validation passed');
  }

  // Sentry initialization
  const sentryDsn = configService.get<string>('sentry.dsn', '');
  const sentryEnabled = configService.get<boolean>('sentry.enabled', false);
  if (sentryDsn && sentryEnabled) {
    Sentry.init({
      dsn: sentryDsn,
      environment: configService.get<string>('NODE_ENV', 'development'),
      tracesSampleRate: isProduction ? 0.1 : 1.0,
      beforeSend: (event) => {
        const sensitivePatterns = ['password', 'token', 'otp', 'secret', 'authorization', 'cookie'];
        if (event.exception?.values) {
          for (const value of event.exception.values) {
            if (value.value && sensitivePatterns.some((p) => value.value!.toLowerCase().includes(p))) {
              value.value = '[REDACTED BY Sentry beforeSend]';
            }
          }
        }
        return event;
      },
    });
  }

  // Security headers (CSP, HSTS, X-Frame, etc.)
  const scriptSrc = ["'self'", "*.cloudfront.net"];
  const styleSrc = ["'self'"];
  if (!isProduction) {
    scriptSrc.push("'unsafe-inline'", "'unsafe-eval'");
    styleSrc.push("'unsafe-inline'");
  }
  await app.register(helmet, {
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc,
        styleSrc,
        imgSrc: ["'self'", "*.s3.amazonaws.com", "*.cloudfront.net", "data:"],
        connectSrc: ["'self'", "ws:", "wss:", "*.sentry.io"],
        fontSrc: ["'self'", "data:"],
        objectSrc: ["'none'"],
        frameAncestors: ["'none'"],
        baseUri: ["'self'"],
        formAction: ["'self'"],
      },
    },
    hsts: { maxAge: 31536000, includeSubDomains: true, preload: true },
    frameguard: { action: 'deny' },
    referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
    noSniff: true,
    xssFilter: true,
  });

  // CSRF protection — provides generateCsrf() utility + csrfProtection preHandler
  await app.register(cookie, { secret: configService.get<string>('JWT_SECRET', 'change-me-to-a-random-64-char-string') });
  await app.register(csrf, { cookieOpts: { signed: true } });
  const fastifyApp: any = app.getHttpAdapter().getInstance();

  // Correlation ID — propagate x-request-id from incoming headers, set response headers
  fastifyApp.addHook('onRequest', (request: any, _reply: any, done: () => void) => {
    const incomingId = request.headers['x-request-id'] || request.headers['x-correlation-id'];
    const ctx = createRequestContext(incomingId as string | undefined);
    request.reqId = ctx.reqId;
    request.correlationId = ctx.correlationId;
    done();
  });
  fastifyApp.addHook('onSend', (request: any, reply: any, _payload: any, done: () => void) => {
    void reply.header('x-request-id', request.reqId);
    void reply.header('x-correlation-id', request.correlationId);
    done();
  });

  fastifyApp.addHook('preHandler', (request: any, reply: any, done: (err?: Error) => void) => {
    if (['GET', 'HEAD', 'OPTIONS'].includes(request.method)) {
      try { reply.generateCsrf?.(); } catch (e) { logger.warn({ err: e }, 'CSRF token generation failed'); }
      return done();
    }
    if (String(request.url).includes('/payments/webhook/')) return done();
    if (request.headers?.authorization) return done();
    if (typeof fastifyApp.csrfProtection === 'function') {
      fastifyApp.csrfProtection(request, reply, (err?: any) => {
        if (err) {
          logger.warn({ err }, 'CSRF validation failed — request blocked');
          return done(new Error('CSRF validation failed'));
        }
        done();
      });
    } else {
      done();
    }
  });

  // Response compression (gzip/brotli)
  await app.register(compress, { threshold: 1024 });

  // Redis Socket.io adapter for horizontal scaling
  const redisIoAdapter = new RedisIoAdapter(app);
  await redisIoAdapter.connectToRedis(configService);
  app.useWebSocketAdapter(redisIoAdapter);

  // CORS
  app.enableCors({
    origin: configService.get<string>('FRONTEND_URL', 'http://localhost:3000'),
    credentials: true,
  });

  // Global prefix (exclude k8s probes)
  app.setGlobalPrefix('api/v1', { exclude: ['live', 'ready', 'health'] });

  // Global pipes
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
      transformOptions: { enableImplicitConversion: true },
      exceptionFactory: (errors) => {
        const messages = errors.flatMap((err) => {
          if (err.constraints) return Object.values(err.constraints);
          if (err.children?.length) {
            return err.children.flatMap((child) =>
              child.constraints ? Object.values(child.constraints) : [],
            );
          }
          return [`Invalid value for ${err.property}`];
        });
        return new BadRequestException({ statusCode: 400, message: messages, error: 'Validation Error', timestamp: new Date().toISOString() });
      },
    }),
  );

  // Prometheus metrics — registry must exist before interceptors
  const register = new Registry();
  collectDefaultMetrics({ register });
  const prismaService = app.get(PrismaService);
  prismaService.registerMetrics(register);

  // Initialize distributed metrics services (business, queue, cache)
  const registryService = app.get(MetricsRegistryService);
  registryService.register = register;
  const redisService = app.get(RedisService);
  redisService.registerMetrics(register);
  const businessMetrics = app.get(BusinessMetricsService);
  businessMetrics.start();
  const queueMetrics = app.get(QueueMetricsService);
  queueMetrics.start();

  // Global filters & interceptors
  app.useGlobalFilters(new AllExceptionsFilter(), new PrismaClientExceptionFilter());
  app.useGlobalInterceptors(new SentryInterceptor(), new MetricsInterceptor(register), new TransformInterceptor(), new LoggingInterceptor());

  // Swagger (dev only)
  if (configService.get<string>('NODE_ENV') !== 'production') {
    const swaggerConfig = new DocumentBuilder()
      .setTitle('Tradingo API — TradHexa Platform')
      .setDescription(`
        Tradingo is the enterprise B2B commerce platform powering TradHexa.
        This API provides access to marketplace, AI, TradeServ, TradeTalk,
        GOCASH wallet, advertising, and platform administration features.

        ## Authentication
        - **JWT Bearer Token** (short-lived, 15 min) — required for most endpoints
        - **Refresh Token** (long-lived, 7 days) — used via POST /auth/refresh

        ## Response Envelope
        All responses follow: { success, data, meta, timestamp }

        ## Error Format
        Errors follow: { statusCode, message, error, timestamp, path }

        ## Rate Limiting
        - Auth endpoints: 5 req/min per IP
        - Search endpoints: 30 req/min
        - General endpoints: 100 req/min

        ## Pagination
        List endpoints return: { data, meta: { total, page, limit, totalPages, hasNext, hasPrevious } }

        Environment: ` + (configService.get<string>('NODE_ENV') || 'development') + `
      `)
      .setVersion('1.0.0')
      .addBearerAuth(
        { type: 'http', scheme: 'bearer', bearerFormat: 'JWT', description: 'Standard JWT access token (expires in 15 min)' },
        'JWT-auth',
      )
      .addBearerAuth(
        { type: 'http', scheme: 'bearer', bearerFormat: 'JWT', description: 'Refresh token for obtaining new access tokens (expires in 7 days)' },
        'Refresh-auth',
      )
      .build();
    const document = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup('api/docs', app, document);
  }

  // Serve metrics on the main API server (for Prometheus scraping)
  const fastifyInstance = app.getHttpAdapter().getInstance();
  fastifyInstance.get('/api/v1/metrics', async (_req: any, reply: any) => {
    reply.header('Content-Type', register.contentType);
    return reply.send(await register.metrics());
  });

  // Internal metrics server for local debugging (loopback only)
  const metricsServer = createServer(async (_req, res) => {
    res.writeHead(200, { 'Content-Type': register.contentType });
    res.end(await register.metrics());
  });
  metricsServer.listen(9100, '127.0.0.1');

  // Start main server
  const port = configService.get<number>('PORT', 3001);
  await app.listen(port, '0.0.0.0');
  logger.info(`API running on http://0.0.0.0:${port}`);
  logger.info(`Swagger docs at http://0.0.0.0:${port}/api/docs`);
  logger.info(`Metrics at http://0.0.0.0:9100/metrics`);

  // Graceful shutdown — enableShutdownHooks() at line 27 handles NestJS lifecycle
  // Prisma $disconnect() is called automatically via OnModuleDestroy
  process.on('SIGTERM', async () => {
    logger.info('Received SIGTERM, shutting down gracefully...');
    metricsServer.close();
    await app.close();
  });
  process.on('SIGINT', async () => {
    logger.info('Received SIGINT, shutting down gracefully...');
    metricsServer.close();
    await app.close();
  });
}
bootstrap();
