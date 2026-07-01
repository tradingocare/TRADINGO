import helmet from '@fastify/helmet';
import csrf from '@fastify/csrf-protection';
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
import { SentryInterceptor } from './common/interceptors/sentry.interceptor';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { RedisIoAdapter } from './modules/chat/redis-io-adapter';

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter({ logger: true, bodyLimit: 100 * 1024 * 1024 }),
  );

  // Sentry initialization
  const configService = app.get(ConfigService);
  const sentryDsn = configService.get<string>('sentry.dsn', '');
  const sentryEnabled = configService.get<boolean>('sentry.enabled', false);
  if (sentryDsn && sentryEnabled) {
    Sentry.init({ dsn: sentryDsn, environment: configService.get<string>('NODE_ENV', 'development') });
  }

  // Security headers
  await app.register(helmet);

  // CSRF protection
  await app.register(csrf);

  // Redis Socket.io adapter for horizontal scaling
  const redisIoAdapter = new RedisIoAdapter(app);
  await redisIoAdapter.connectToRedis(configService);
  app.useWebSocketAdapter(redisIoAdapter);

  // CORS
  app.enableCors({
    origin: configService.get<string>('FRONTEND_URL', 'http://localhost:3000'),
    credentials: true,
  });

  // Global prefix
  app.setGlobalPrefix('api/v1');

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

  // Global filters & interceptors
  app.useGlobalFilters(new AllExceptionsFilter());
  app.useGlobalInterceptors(new SentryInterceptor(), new TransformInterceptor(), new LoggingInterceptor());

  // Swagger (dev only)
  if (configService.get<string>('NODE_ENV') !== 'production') {
    const swaggerConfig = new DocumentBuilder()
      .setTitle('Tradingo API')
      .setDescription('Tradingo backend API')
      .setVersion('1.0.0')
      .addBearerAuth()
      .build();
    const document = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup('api/docs', app, document);
  }

  // Prometheus metrics on separate internal HTTP server (port 9100)
  const register = new Registry();
  collectDefaultMetrics({ register });
  const metricsServer = createServer(async (_req, res) => {
    res.writeHead(200, { 'Content-Type': register.contentType });
    res.end(await register.metrics());
  });
  metricsServer.listen(9100, '0.0.0.0');

  // Start main server
  const port = configService.get<number>('PORT', 3001);
  await app.listen(port, '0.0.0.0');
  console.log(`API running on http://0.0.0.0:${port}`);
  console.log(`Swagger docs at http://0.0.0.0:${port}/api/docs`);
  console.log(`Metrics at http://0.0.0.0:9100/metrics`);

  // Graceful shutdown
  const gracefulShutdown = async (signal: string) => {
    console.log(`Received ${signal}, shutting down gracefully...`);
    metricsServer.close();
    await app.close();
    process.exit(0);
  };
  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  process.on('SIGINT', () => gracefulShutdown('SIGINT'));
}
bootstrap();
