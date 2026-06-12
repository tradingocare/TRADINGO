import { of } from 'rxjs';
import { TransformInterceptor } from './transform.interceptor';

describe('TransformInterceptor', () => {
  let interceptor: TransformInterceptor<any>;
  let mockContext: any;
  let mockCallHandler: any;

  beforeEach(() => {
    interceptor = new TransformInterceptor();
    mockContext = {
      switchToHttp: jest.fn(() => ({
        getResponse: jest.fn(() => ({ statusCode: 200 })),
      })),
    };
    mockCallHandler = {
      handle: jest.fn(() => of({ id: '1', name: 'test' })),
    };
  });

  it('should wrap response in ApiResponse format', (done) => {
    interceptor.intercept(mockContext, mockCallHandler).subscribe((result) => {
      expect(result.statusCode).toBe(200);
      expect(result.message).toBe('Success');
      expect(result.data).toEqual({ id: '1', name: 'test' });
      expect(result.timestamp).toBeDefined();
      done();
    });
  });
});
