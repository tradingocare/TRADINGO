jest.mock('@sentry/nextjs', () => {
  const mockModule = {
    captureException: jest.fn(),
    captureMessage: jest.fn(),
    setUser: jest.fn(),
    setTag: jest.fn(),
    addBreadcrumb: jest.fn(),
    startInactiveSpan: jest.fn().mockReturnValue({ end: jest.fn() }),
    init: jest.fn(),
    replayIntegration: jest.fn().mockReturnValue({ name: 'Replay', setupOnce: jest.fn() }),
  };
  return mockModule;
});

const OLD_ENV = process.env;

beforeEach(() => {
  jest.resetModules();
  process.env = { ...OLD_ENV };
  delete process.env.NEXT_PUBLIC_SENTRY_DSN;
  delete process.env.SENTRY_DSN;
});

afterAll(() => {
  process.env = OLD_ENV;
});

describe('isSentryEnabled', () => {
  it('returns false when no DSN is set', async () => {
    const { isSentryEnabled } = await import('../sentry');
    expect(isSentryEnabled()).toBe(false);
  });

  it('returns true when NEXT_PUBLIC_SENTRY_DSN is set', async () => {
    process.env.NEXT_PUBLIC_SENTRY_DSN = 'https://key@sentry.io/project';
    const { isSentryEnabled } = await import('../sentry');
    expect(isSentryEnabled()).toBe(true);
  });

  it('returns true when SENTRY_DSN is set', async () => {
    process.env.SENTRY_DSN = 'https://key@sentry.io/project';
    const { isSentryEnabled } = await import('../sentry');
    expect(isSentryEnabled()).toBe(true);
  });
});

describe('stripPII', () => {
  it('redacts PAN numbers', async () => {
    const { stripPII } = await import('../sentry');
    expect(stripPII('My PAN is ABCDE1234F')).toBe('My PAN is [REDACTED]');
  });

  it('redacts Aadhaar numbers', async () => {
    const { stripPII } = await import('../sentry');
    expect(stripPII('Aadhaar: 123456789012')).toBe('Aadhaar: [REDACTED]');
  });

  it('redacts long hex strings (tokens)', async () => {
    const { stripPII } = await import('../sentry');
    const token = 'a'.repeat(40);
    expect(stripPII(`token=${token}`)).toBe('token=[REDACTED]');
  });

  it('passes through clean text unchanged', async () => {
    const { stripPII } = await import('../sentry');
    expect(stripPII('Hello world')).toBe('Hello world');
  });
});

describe('sanitizeExtra', () => {
  it('redacts sensitive field names', async () => {
    const { sanitizeExtra } = await import('../sentry');
    const result = sanitizeExtra({ password: 'secret123', token: 'abc', normalField: 'hello' });
    expect(result.password).toBe('[REDACTED]');
    expect(result.token).toBe('[REDACTED]');
    expect(result.normalField).toBe('hello');
  });

  it('truncates long string values', async () => {
    const { sanitizeExtra } = await import('../sentry');
    const long = 'x'.repeat(1000);
    const result = sanitizeExtra({ data: long });
    expect(result.data).toHaveLength(512);
  });
});

describe('captureError', () => {
  it('logs to console when Sentry is not enabled', async () => {
    const { captureError } = await import('../sentry');
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
    await captureError(new Error('test'));
    expect(consoleSpy).toHaveBeenCalledWith('[Monitoring]', expect.any(Error), undefined);
    consoleSpy.mockRestore();
  });

  it('sends to Sentry via captureException when enabled', async () => {
    process.env.NEXT_PUBLIC_SENTRY_DSN = 'https://key@sentry.io/project';
    const Sentry = await import('@sentry/nextjs');
    const { captureError } = await import('../sentry');
    await captureError(new Error('test'), { contextField: 'value' });
    expect(Sentry.captureException).toHaveBeenCalled();
  });
});

describe('captureMessage', () => {
  it('logs to console when Sentry is not enabled', async () => {
    const { captureMessage } = await import('../sentry');
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
    await captureMessage('test message');
    expect(consoleSpy).toHaveBeenCalledWith('[Monitoring]', 'test message', undefined);
    consoleSpy.mockRestore();
  });

  it('sends to Sentry via captureMessage when enabled', async () => {
    process.env.NEXT_PUBLIC_SENTRY_DSN = 'https://key@sentry.io/project';
    const Sentry = await import('@sentry/nextjs');
    const { captureMessage } = await import('../sentry');
    await captureMessage('test message');
    expect(Sentry.captureMessage).toHaveBeenCalledWith('test message', expect.any(Object));
  });
});

describe('setUserContext', () => {
  it('calls setUser with user data when enabled', async () => {
    process.env.NEXT_PUBLIC_SENTRY_DSN = 'https://key@sentry.io/project';
    const Sentry = await import('@sentry/nextjs');
    const { setUserContext } = await import('../sentry');
    await setUserContext({ id: 'u1', companyId: 'c1', role: 'ADMIN' });
    expect(Sentry.setUser).toHaveBeenCalledWith({ id: 'u1', companyId: 'c1', role: 'ADMIN' });
  });

  it('calls setUser(null) to clear context', async () => {
    process.env.NEXT_PUBLIC_SENTRY_DSN = 'https://key@sentry.io/project';
    const Sentry = await import('@sentry/nextjs');
    const { setUserContext } = await import('../sentry');
    await setUserContext(null);
    expect(Sentry.setUser).toHaveBeenCalledWith(null);
  });
});

describe('addBreadcrumb', () => {
  it('logs to console when not enabled', async () => {
    const { addBreadcrumb } = await import('../sentry');
    const consoleSpy = jest.spyOn(console, 'debug').mockImplementation();
    await addBreadcrumb('test breadcrumb', 'ui');
    expect(consoleSpy).toHaveBeenCalledWith('[Monitoring]', 'test breadcrumb', undefined);
    consoleSpy.mockRestore();
  });
});

describe('setTags', () => {
  it('calls setTag for each tag when enabled', async () => {
    process.env.NEXT_PUBLIC_SENTRY_DSN = 'https://key@sentry.io/project';
    const Sentry = await import('@sentry/nextjs');
    const { setTags } = await import('../sentry');
    await setTags({ environment: 'production', version: '1.0' });
    expect(Sentry.setTag).toHaveBeenCalledWith('environment', 'production');
    expect(Sentry.setTag).toHaveBeenCalledWith('version', '1.0');
  });
});

describe('error boundary capture', () => {
  it('captureError handles errors from ErrorState gracefully', async () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
    const { captureError } = await import('../sentry');
    const err = new Error('render crash');
    await captureError(err, { boundary: 'ErrorState' });
    expect(consoleSpy).toHaveBeenCalledWith('[Monitoring]', err, { boundary: 'ErrorState' });
    consoleSpy.mockRestore();
  });
});
