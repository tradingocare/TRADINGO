export function getWsCorsOrigin(): string[] {
  const env = process.env.NODE_ENV || 'development';
  const origins: Record<string, string[]> = {
    development: ['http://localhost:3000', 'http://127.0.0.1:3000'],
    staging: ['https://staging.tradingo.app'],
    production: ['https://tradingo.app', 'https://www.tradingo.app'],
  };
  const custom = process.env.WS_CORS_ORIGIN;
  if (custom) return custom.split(',');
  return origins[env] || origins.development;
}
