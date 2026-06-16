const SENSITIVE_FIELDS = new Set([
  'password', 'token', 'secret', 'authorization', 'cookie',
  'pan', 'gst', 'aadhaar', 'aadhar', 'gstin', 'panNumber',
  'gstNumber', 'aadhaarNumber', 'creditCard', 'cvv',
  'refreshToken', 'accessToken', 'apiKey',
]);

const PII_PATTERNS = [
  /\b[A-Z]{5}[0-9]{4}[A-Z]{1}\b/g,
  /\b[0-9]{12}\b/g,
  /\b[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[0-9A-Z]{1}[Z]{1}[0-9A-Z]{1}\b/g,
  /\b[a-fA-F0-9]{40,}\b/g,
];

let sentryModule: typeof import('@sentry/nextjs') | null = null;

async function getSentry() {
  if (!sentryModule) {
    try {
      sentryModule = await import('@sentry/nextjs');
    } catch {
      return null;
    }
  }
  return sentryModule;
}

function hasDSN(): boolean {
  return !!(typeof process !== 'undefined' && (process.env?.NEXT_PUBLIC_SENTRY_DSN || process.env?.SENTRY_DSN));
}

export function isSentryEnabled(): boolean {
  return hasDSN();
}

export function getSentryRelease(): string {
  if (typeof process === 'undefined') return 'web@unknown';
  return process.env?.NEXT_PUBLIC_APP_VERSION || `web@${new Date().toISOString().slice(0, 10)}`;
}

export function stripPII(value: string): string {
  let cleaned = value;
  for (const pattern of PII_PATTERNS) {
    cleaned = cleaned.replace(pattern, '[REDACTED]');
  }
  return cleaned;
}

export function sanitizeExtra(extra: Record<string, unknown>): Record<string, unknown> {
  const sanitized: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(extra)) {
    if (SENSITIVE_FIELDS.has(key.toLowerCase().replace(/[_-]/g, ''))) {
      sanitized[key] = '[REDACTED]';
    } else if (typeof value === 'string' && value.length > 512) {
      sanitized[key] = value.slice(0, 512);
    } else if (typeof value === 'string') {
      sanitized[key] = stripPII(value);
    } else {
      sanitized[key] = value;
    }
  }
  return sanitized;
}

export async function captureError(error: unknown, context?: Record<string, unknown>) {
  if (!hasDSN()) {
    console.error('[Monitoring]', error, context);
    return;
  }
  const Sentry = await getSentry();
  if (!Sentry) return;
  Sentry.captureException(error, {
    extra: context ? sanitizeExtra(context) : undefined,
  });
}

export async function captureMessage(message: string, context?: Record<string, unknown>) {
  if (!hasDSN()) {
    console.log('[Monitoring]', message, context);
    return;
  }
  const Sentry = await getSentry();
  if (!Sentry) return;
  Sentry.captureMessage(message, {
    extra: context ? sanitizeExtra(context) : undefined,
  });
}

export async function setUserContext(user: { id: string; companyId?: string; role?: string } | null) {
  if (!hasDSN()) return;
  const Sentry = await getSentry();
  if (!Sentry) return;
  if (!user) {
    Sentry.setUser(null);
    return;
  }
  Sentry.setUser({
    id: user.id,
    companyId: user.companyId,
    role: user.role,
  });
}

export async function addBreadcrumb(message: string, category?: string, data?: Record<string, unknown>) {
  if (!hasDSN()) {
    console.debug('[Monitoring]', message, data);
    return;
  }
  const Sentry = await getSentry();
  if (!Sentry) return;
  Sentry.addBreadcrumb({
    message,
    category,
    data: data ? sanitizeExtra(data) : undefined,
  });
}

export async function setTags(tags: Record<string, string>) {
  if (!hasDSN()) return;
  const Sentry = await getSentry();
  if (!Sentry) return;
  for (const [key, value] of Object.entries(tags)) {
    Sentry.setTag(key, value);
  }
}
