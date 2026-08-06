import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable, tap } from 'rxjs';
import { logger, createRequestContext } from '../logger';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  intercept<T>(context: ExecutionContext, next: CallHandler<T>): Observable<T> {
    const request = context.switchToHttp().getRequest();
    const { method, url } = request;
    const ctx = createRequestContext();
    const start = Date.now();

    request.reqId = ctx.reqId;
    request.correlationId = ctx.correlationId;

    logger.info({ reqId: ctx.reqId, correlationId: ctx.correlationId, method, url }, 'incoming request');

    return next.handle().pipe(
      tap({
        next: () => {
          const response = context.switchToHttp().getResponse();
          const { statusCode } = response;
          const duration = Date.now() - start;
          logger.info({ reqId: ctx.reqId, method, url, statusCode, durationMs: duration }, 'request completed');
        },
        error: (error) => {
          const duration = Date.now() - start;
          logger.error({ reqId: ctx.reqId, method, url, durationMs: duration, err: error }, 'request failed');
        },
      }),
    );
  }
}
