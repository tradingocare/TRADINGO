import pino from 'pino';
import { v4 as uuidv4 } from 'uuid';

const isProduction = process.env.NODE_ENV === 'production';

export const logger = pino({
  level: process.env.LOG_LEVEL || (isProduction ? 'info' : 'debug'),
  transport: isProduction
    ? undefined
    : {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'SYS:standard',
          ignore: 'pid,hostname,reqId,correlationId',
        },
      },
  serializers: {
    req: (req) => ({
      method: req.method,
      url: req.url,
      headers: req.headers ? {
        'user-agent': req.headers['user-agent'],
        'content-type': req.headers['content-type'],
        'x-request-id': req.headers['x-request-id'],
      } : undefined,
    }),
    res: (res) => ({
      statusCode: res.statusCode,
    }),
    err: pino.stdSerializers.err,
  },
  redact: {
    paths: [
      'req.headers.authorization',
      'req.headers.cookie',
      'req.headers["set-cookie"]',
      'body.password',
      'body.token',
      'body.secret',
      'body.newPassword',
      'body.otp',
      'body.accessToken',
      'body.refreshToken',
    ],
    censor: '[REDACTED]',
  },
});

export function createRequestContext(incomingId?: string): { reqId: string; correlationId: string } {
  const reqId = incomingId || uuidv4();
  return {
    reqId,
    correlationId: reqId,
  };
}

export type RequestContext = ReturnType<typeof createRequestContext>;
