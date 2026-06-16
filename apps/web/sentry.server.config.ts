import * as Sentry from '@sentry/nextjs';

const dsn = process.env.SENTRY_DSN;

if (dsn) {
  Sentry.init({
    dsn,
    environment: process.env.NEXT_PUBLIC_APP_ENV || process.env.NODE_ENV || 'development',
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.25 : 1.0,
    beforeSend(event) {
      if (event.request?.headers) {
        const sensitive = ['cookie', 'authorization', 'x-api-key', 'set-cookie'];
        for (const header of sensitive) {
          if (event.request.headers[header]) {
            event.request.headers[header] = '[REDACTED]';
          }
        }
      }
      return event;
    },
    ignoreErrors: [
      'NetworkError',
      'AbortError',
    ],
  });
}
