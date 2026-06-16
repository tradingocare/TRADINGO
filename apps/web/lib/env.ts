export interface EnvConfig {
  apiUrl: string;
  socketUrl: string;
  siteUrl: string;
  appUrl: string;
  sentryDsn: string | undefined;
  appVersion: string | undefined;
  appEnv: string | undefined;
  gaId: string | undefined;
}

function getEnvVar(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(
      `Missing required environment variable: ${key}\n` +
        `Please ensure ${key} is set in your .env file or environment.\n` +
        `See .env.example for the full list of required variables.`,
    );
  }
  return value;
}

function getOptionalEnvVar(key: string): string | undefined {
  return process.env[key] || undefined;
}

let cachedConfig: EnvConfig | null = null;

export function getEnvConfig(): EnvConfig {
  if (cachedConfig) return cachedConfig;

  const config: EnvConfig = {
    apiUrl: getEnvVar('NEXT_PUBLIC_API_URL'),
    socketUrl: getEnvVar('NEXT_PUBLIC_SOCKET_URL'),
    siteUrl: getEnvVar('NEXT_PUBLIC_SITE_URL'),
    appUrl: getOptionalEnvVar('NEXT_PUBLIC_APP_URL') || getEnvVar('NEXT_PUBLIC_SITE_URL'),
    sentryDsn: getOptionalEnvVar('NEXT_PUBLIC_SENTRY_DSN') || getOptionalEnvVar('SENTRY_DSN'),
    appVersion: getOptionalEnvVar('NEXT_PUBLIC_APP_VERSION'),
    appEnv: getOptionalEnvVar('NEXT_PUBLIC_APP_ENV'),
    gaId: getOptionalEnvVar('GA_ID'),
  };

  cachedConfig = config;
  return config;
}

export function isBrowser(): boolean {
  return typeof window !== 'undefined';
}
