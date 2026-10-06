import type { ConfigService } from '@nestjs/config';

/** Minimal logger surface — accepts Nest Logger, pino, or any warn-capable logger. */
export interface CsrfHookLogger {
  warn(...args: unknown[]): void;
}

/**
 * F-6: CSRF rejection must surface as HTTP 403 — never an anonymous 500.
 *
 * The anonymous state-changing preHandler previously propagated CSRF
 * failures via done(new Error(...)); a bare Error carries no statusCode,
 * so Fastify's default handler answered 500 "Internal Server Error".
 * The @fastify/csrf-protection contract itself is 403
 * (FST_CSRF_INVALID_TOKEN / FST_CSRF_MISSING_SECRET), and this hook now
 * replies with the platform's standard error envelope at 403 directly.
 *
 * Extracted from main.ts bootstrap (byte-identical behavior) so the
 * rejection contract is unit-testable against the real plugin.
 */
export function registerCsrfPreHandler(
  fastifyApp: any,
  configService: ConfigService,
  logger: CsrfHookLogger,
): void {
  fastifyApp.addHook('preHandler', (request: any, reply: any, done: (err?: Error) => void) => {
    if (['GET', 'HEAD', 'OPTIONS'].includes(request.method)) {
      try { reply.generateCsrf?.(); } catch (e) { logger.warn({ err: e }, 'CSRF token generation failed'); }
      return done();
    }
    if (String(request.url).includes('/payments/webhook/')) return done();
    if (String(request.url).endsWith('/membership/webhook')) return done();
    if (request.headers?.authorization) return done();
    // Requests from the configured frontend origin are not cross-site forgeries
    // (mirrors the CORS allowlist — same-origin proxied traffic in production).
    const trustedOrigin = configService.get<string>('FRONTEND_URL', 'http://localhost:3000');
    if (request.headers?.origin && request.headers.origin === trustedOrigin) return done();
    if (typeof fastifyApp.csrfProtection === 'function') {
      // F-6: fail closed with an explicit 403 on ANY CSRF-layer failure.
      // A bare Error passed to done() carries no statusCode, so Fastify's
      // default handler would answer 500; a synchronous throw inside the
      // plugin call would do the same. Reply directly with the platform's
      // standard error envelope instead.
      let completed = false;
      try {
        fastifyApp.csrfProtection(request, reply, (err?: any) => {
          completed = true;
          if (err) {
            logger.warn({ err }, 'CSRF validation failed — request blocked');
            reply.status(403).send({
              statusCode: 403,
              message: 'CSRF validation failed',
              timestamp: new Date().toISOString(),
              path: request.url,
            });
            return;
          }
          done();
        });
      } catch (err) {
        if (completed) throw err;
        logger.warn({ err }, 'CSRF validation failed — request blocked');
        reply.status(403).send({
          statusCode: 403,
          message: 'CSRF validation failed',
          timestamp: new Date().toISOString(),
          path: request.url,
        });
        return;
      }
    } else {
      done();
    }
  });
}
