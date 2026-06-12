import { of, throwError } from 'rxjs';
import { SentryInterceptor } from './sentry.interceptor';

jest.mock('@sentry/nestjs', () => ({
  captureException: jest.fn(),
}));

describe('SentryInterceptor', () => {
  let interceptor: SentryInterceptor;
  let mockContext: any;

  beforeEach(() => {
    interceptor = new SentryInterceptor();
    mockContext = {
      switchToHttp: jest.fn(),
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
});
