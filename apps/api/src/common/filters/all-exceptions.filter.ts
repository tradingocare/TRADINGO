import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common';
import { ThrottlerException } from '@nestjs/throttler';
import { FastifyReply, FastifyRequest } from 'fastify';
import * as Sentry from '@sentry/nestjs';
import { logger } from '../logger';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<FastifyReply>();
    const request = ctx.getRequest<FastifyRequest>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';

    if (exception instanceof ThrottlerException) {
      status = HttpStatus.TOO_MANY_REQUESTS;
      message = 'Too many requests, please try again later';
    } else if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exResponse = exception.getResponse();
      message = typeof exResponse === 'string' ? exResponse : (exResponse as Record<string, unknown>).message as string || message;
    }

    // 429s are expected traffic control, not application errors — log at warn
    // to avoid flooding error-level logs during legitimate rate limiting.
    if (status === HttpStatus.TOO_MANY_REQUESTS) {
      logger.warn({ status, path: request.url }, `${request.method} ${request.url} ${status} (rate limited)`);
    } else {
      logger.error({ err: exception, status, path: request.url }, `${request.method} ${request.url} ${status}`);
    }

    // Send unhandled 5xx errors to Sentry (4xx are client errors, skip to reduce noise)
    if (status >= 500) {
      Sentry.withScope((scope) => {
        scope.setExtra('path', request.url);
        scope.setExtra('method', request.method);
        scope.setTag('status', String(status));
        Sentry.captureException(exception instanceof Error ? exception : new Error(String(message)));
      });
    }

    response.status(status).send({
      statusCode: status,
      message,
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }
}
