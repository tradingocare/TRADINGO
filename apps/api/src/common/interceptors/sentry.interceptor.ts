import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable, catchError, throwError } from 'rxjs';
import * as Sentry from '@sentry/nestjs';

const SENSITIVE_FIELDS = ['password', 'token', 'otp', 'secret', 'authorization', 'cookie'];

@Injectable()
export class SentryInterceptor implements NestInterceptor {
  intercept<T>(context: ExecutionContext, next: CallHandler<T>): Observable<T> {
    const request = context.switchToHttp().getRequest();

    // Attach user/request context to Sentry scope
    Sentry.withScope((scope) => {
      if (request.user?.sub || request.user?.id) {
        scope.setUser({ id: request.user.sub || request.user.id, email: request.user.email });
      }
      scope.setTag('path', request.routeOptions?.url || request.url);
      scope.setTag('method', request.method);
      if (request.correlationId) scope.setTag('correlationId', request.correlationId);
      scope.setExtra('url', String(request.url));
      if (request.headers?.['user-agent']) scope.setExtra('userAgent', String(request.headers['user-agent']));
    });

    return next.handle().pipe(
      catchError((error) => {
        Sentry.withScope((scope) => {
          if (request.user?.sub || request.user?.id) {
            scope.setUser({ id: request.user.sub || request.user.id, email: request.user.email });
          }
          scope.setTag('path', request.routeOptions?.url || request.url);
          scope.setTag('method', request.method);
          if (request.correlationId) scope.setTag('correlationId', request.correlationId);
          if (request.headers?.['user-agent']) scope.setExtra('userAgent', String(request.headers['user-agent']));

          if (error?.message && SENSITIVE_FIELDS.some((f) => error.message.toLowerCase().includes(f))) {
            scope.setExtra('redacted', true);
            Sentry.captureException(new Error('[REDACTED]'));
          } else {
            Sentry.captureException(error);
          }
        });
        return throwError(() => error);
      }),
    );
  }
}
