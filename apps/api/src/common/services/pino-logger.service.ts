import { LoggerService } from '@nestjs/common';
import { logger } from '../logger';

export class PinoLoggerService implements LoggerService {
  log(message: any, context?: string) {
    if (typeof message === 'object') {
      logger.info({ ...message, context }, message.msg || 'log');
    } else {
      logger.info({ context }, message);
    }
  }

  warn(message: any, context?: string) {
    if (typeof message === 'object') {
      logger.warn({ ...message, context }, message.msg || 'warn');
    } else {
      logger.warn({ context }, message);
    }
  }

  error(message: any, trace?: string, context?: string) {
    if (typeof message === 'object') {
      logger.error({ ...message, context, trace }, message.msg || 'error');
    } else {
      logger.error({ context, trace }, message);
    }
  }

  debug(message: any, context?: string) {
    if (typeof message === 'object') {
      logger.debug({ ...message, context }, message.msg || 'debug');
    } else {
      logger.debug({ context }, message);
    }
  }

  verbose(message: any, context?: string) {
    if (typeof message === 'object') {
      logger.trace({ ...message, context }, message.msg || 'verbose');
    } else {
      logger.trace({ context }, message);
    }
  }
}
