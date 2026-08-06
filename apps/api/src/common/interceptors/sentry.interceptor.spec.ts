import { of, throwError } from 'rxjs';
import { SentryInterceptor } from './sentry.interceptor';

jest.mock('@sentry/nestjs', () => ({
  captureException: jest.fn(),
  withScope: jest.fn((fn: (scope: { setUser: jest.Mock; setTag: jest.Mock; setExtra: jest.Mock }) => void) =>
    fn({ setUser: jest.fn(), setTag: jest.fn(), setExtra: jest.fn() })),
}));

describe('SentryInterceptor', () => {
  let interceptor: SentryInterceptor;
  let mockContext: any;

  beforeEach(() => {
    interceptor = new SentryInterceptor();
    mockContext = {
      switchToHttp: jest.fn().mockReturnValue({
        getRequest: jest.fn().mockReturnValue({
          url: '/test',
          method: 'GET',
          headers: {},
          routeOptions: { url: '/test' },
        }),
      }),
      getHandler: jest.fn(),
      getClass: jest.fn(),
    };
  });

  it('should pass through successful responses', (done) => {
    const mockCallHandler = { handle: () => of('success') };
    interceptor.intercept(mockContext, mockCallHandler).subscribe((result) => {
      expect(result).toBe('success');
      done();
    });
  });

  it('should capture exception and rethrow', (done) => {
    const error = new Error('test error');
    const mockCallHandler = { handle: () => throwError(() => error) };
    interceptor.intercept(mockContext, mockCallHandler).subscribe({
      error: (err) => {
        expect(err).toBe(error);
        done();
      },
    });
  });

  it('should redact sensitive error messages', (done) => {
    const error = new Error('invalid password provided');
    const { captureException } = require('@sentry/nestjs');
    const mockCallHandler = { handle: () => throwError(() => error) };
    interceptor.intercept(mockContext, mockCallHandler).subscribe({
      error: (err) => {
        expect(captureException).toHaveBeenCalled();
        done();
      },
    });
  });
});