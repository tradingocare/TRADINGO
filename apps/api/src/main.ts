import helmet from '@fastify/helmet';
import csrf from '@fastify/csrf-protection';
import cookie from '@fastify/cookie';
import compress from '@fastify/compress';
import multipart from '@fastify/multipart';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { collectDefaultMetrics, Registry } from 'prom-client';
import { createServer } from 'http';
import * as Sentry from '@sentry/nestjs';
import { AppModule } from './app.module';
import { ProductionConfigValidator } from './common/services/production-config-validator.service';
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
import { registerCsrfPreHandler } from './common/hooks/csrf-prehandler';

async function bootstrap() {
  // Global process-level error handlers â€” prevent Node.js crashes on unhandled rejections
  process.on('unhandledRejection', (reason: unknown) => {
    logger.error({ err: reason }, 'UNHANDLED PROMISE REJECTION â€” application will continue, but investigate the cause');
    Sentry.captureException(reason instanceof Error ? reason : new Error(String(reason)));
  });
  process.on('uncaughtException', (error: Error) => {
    logger.error({ err: error }, 'UNCAUGHT EXCEPTION â€” application may become unstable');
    Sentry.captureException(error);
    // Graceful shutdown â€” give time for cleanup
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
      // Production only-entry is nginx (loopback-bound); Cloudflare sets X-Forwarded-For
      // at the edge and nginx appends it. Formerly unset, req.ip returned the nginx/edge
      // IP, making the per-IP throttler (5-100 req/min) ineffective behind the proxy.
      trustProxy: true,
    }),
  );

  app.enableShutdownHooks();

  // Replace NestJS ConsoleLogger with Pino (structured JSON in production)
  app.useLogger(new PinoLoggerService());

  const configService = app.get(ConfigService);


  const isProduction = configService.get<string>('NODE_ENV') === 'production';

  // Sentry flags are resolved once and reused by the initialization block below
  const sentryDsn = configService.get<string>('sentry.dsn', '');
  const sentryEnabled = configService.get<boolean>('sentry.enabled', false);

  // Production credential validation (consolidated)
  if (isProduction) {
    const validator = app.get(ProductionConfigValidator);
    const result = validator.validate(configService, isProduction);
    validator.logResult(result);
    if (result.errors.length > 0) {
      throw new Error(`Production environment validation failed:\n  ${result.errors.join('\n  ')}`);
    }
  }

  // Sentry initialization (dsn/enabled resolved during credential validation above)
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

  // CSRF protection â€” provides generateCsrf() utility + csrfProtection preHandler
  await app.register(cookie, { secret: configService.get<string>('JWT_SECRET', 'change-me-to-a-random-64-char-string') });
  await app.register(csrf, { cookieOpts: { signed: true, path: '/', sameSite: true, httpOnly: true } });
  const fastifyApp: any = app.getHttpAdapter().getInstance();

  // Correlation ID â€” propagate x-request-id from incoming headers, set response headers
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

  // CSRF preHandler (F-6: anonymous CSRF rejection is a 403, not a 500)
  registerCsrfPreHandler(fastifyApp, configService, logger);

  // Response compression (gzip/brotli)
  await app.register(compress, { threshold: 1024 });

  // Multipart parsing — the API runs on the Fastify adapter and every
  // upload route (catalog-import, storage) previously died with a
  // Fastify-native HTTP 415 because no multipart parser was registered.
  // Notes on @fastify/multipart behavior (verified against the installed
  // v9 source): its preValidation hook consumes the stream and, with
  // attachFieldsToBody 'keyValues', exposes file bytes as req.body[field]
  // plus text fields as strings (multer-identical body shape).
  // - Global fileSize cap is 100 MB (the pre-existing storage allowance;
  //   catalog keeps its own 50 MB controller check, unchanged).
  // - onFile stashes filename/mimetype metadata (keyValues keeps only
  //   the buffer) for the FastifyFileInterceptor layer below.
  // - Per-route file-count caps live in the interceptor (single: 1,
  //   multi: MAX_FILES), mirroring multer semantics.
  await app.register(multipart, {
    limits: { fileSize: 100 * 1024 * 1024 },
    attachFieldsToBody: 'keyValues',
    onFile: async function (this: any, part: any) {
      this.savedUploads = this.savedUploads || [];
      this.savedUploads.push({
        fieldname: part.fieldname,
        filename: part.filename,
        encoding: part.encoding,
        mimetype: part.mimetype,
      });
      await part.toBuffer();
    },
  });

  // Redis Socket.io adapter for horizontal scaling
  const redisIoAdapter = new RedisIoAdapter(app);
  await redisIoAdapter.connectToRedis(configService);
  app.useWebSocketAdapter(redisIoAdapter);

  // CORS
  app.enableCors({
    origin: configService.get<string>('FRONTEND_URL', 'http://localhost:3000'),
    credentials: true,
    methods: ['GET', 'HEAD', 'POST', 'PUT', 'PATCH', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-csrf-token'],
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

  // Prometheus metrics â€” registry must exist before interceptors
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
      .setTitle('Tradingo API â€” TradHexa Platform')
      .setDescription(`
        Tradingo is the enterprise B2B commerce platform powering TradHexa.
        This API provides access to marketplace, AI, TradeServ, TradeTalk,
        GOCASH wallet, advertising, and platform administration features.

        ## Authentication
        - **JWT Bearer Token** (short-lived, 15 min) â€” required for most endpoints
        - **Refresh Token** (long-lived, 7 days) â€” used via POST /auth/refresh

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
  metricsServer.on('error', (err: NodeJS.ErrnoException) => {
    if (err.code === 'EADDRINUSE') {
      logger.warn('Metrics server port 9100 already in use â€” skipping internal metrics server');
    } else {
      logger.error(`Metrics server error: ${err.message}`);
    }
  });
  metricsServer.listen(9100, '127.0.0.1');

  // Start main server
  const port = configService.get<number>('PORT', 3001);
  await app.listen(port, '0.0.0.0');
  logger.info(`API running on http://0.0.0.0:${port}`);
  logger.info(`Swagger docs at http://0.0.0.0:${port}/api/docs`);
  logger.info(`Metrics at http://0.0.0.0:9100/metrics`);

  // Graceful shutdown â€” enableShutdownHooks() at line 27 handles NestJS lifecycle
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


