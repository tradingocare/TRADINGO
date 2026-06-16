import * as Sentry from '@sentry/nextjs';

const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN || process.env.SENTRY_DSN;

if (dsn) {
  Sentry.init({
    dsn,
    environment: process.env.NEXT_PUBLIC_APP_ENV || process.env.NODE_ENV || 'development',
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.25 : 1.0,
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,
    integrations: [
      Sentry.replayIntegration({
        maskAllText: true,
        blockAllMedia: true,
      }),
    ],
    beforeSend(event) {
      if (event.request?.headers) {
        const sensitive = ['cookie', 'authorization', 'x-api-key', 'set-cookie'];
        for (const header of sensitive) {
          if (event.request.headers[header]) {
            event.request.headers[header] = '[REDACTED]';
          }
        }
      }
      if (event.exception?.values) {
        for (const value of event.exception.values) {
          if (value.value) {
            value.value = value.value.replace(
              /([A-Za-z0-9+/=]{20,})/g,
              '[REDACTED]',
            );
          }
        }
      }
      return event;
    },
    ignoreErrors: [
      'NetworkError',
      'AbortError',
      'ResizeObserver loop limit exceeded',
      'ResizeObserver loop completed with undelivered notifications',
    ],
  });
}
