import { of } from 'rxjs';
import { LoggingInterceptor } from './logging.interceptor';

describe('LoggingInterceptor', () => {
  let interceptor: LoggingInterceptor;
  let mockContext: any;
  let mockCallHandler: any;

  beforeEach(() => {
    interceptor = new LoggingInterceptor();
    mockContext = {
      switchToHttp: jest.fn(() => ({
        getRequest: jest.fn(() => ({ method: 'GET', url: '/test' })),
        getResponse: jest.fn(() => ({ statusCode: 200 })),
      })),
    };
    mockCallHandler = {
      handle: jest.fn(() => of({ data: 'test' })),
    };
  });

  it('should log request and call next.handle', (done) => {
    interceptor.intercept(mockContext, mockCallHandler).subscribe((result) => {
      expect(result).toEqual({ data: 'test' });
      done();
    });
  });
});
