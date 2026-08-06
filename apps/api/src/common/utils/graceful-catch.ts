import { logger } from '../logger';

type DefaultValue<T> = T | (() => T);

function resolveDefault<T>(defaultVal: DefaultValue<T>): T {
  return typeof defaultVal === 'function' ? (defaultVal as () => T)() : defaultVal;
}

export function gracefulCatch<T>(context: string, defaultVal: DefaultValue<T>): (error: unknown) => T {
  return (error: unknown) => {
    logger.warn({ error, context }, `Graceful degradation in ${context}`);
    return resolveDefault(defaultVal);
  };
}

export function gracefulCatchAsync<T>(context: string, defaultVal: DefaultValue<Promise<T>>): (error: unknown) => Promise<T> {
  return async (error: unknown) => {
    logger.warn({ error, context }, `Graceful degradation in ${context}`);
    return resolveDefault(defaultVal);
  };
}

export function withGracefulDegradation<T, R>(
  fn: () => Promise<T>,
  context: string,
  defaultVal: DefaultValue<R>,
): Promise<T | R> {
  return fn().catch(gracefulCatch(context, defaultVal));
}
