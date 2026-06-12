import { HttpException, HttpStatus } from '@nestjs/common';
import { AllExceptionsFilter } from './all-exceptions.filter';

describe('AllExceptionsFilter', () => {
  let filter: AllExceptionsFilter;
  let mockResponse: any;
  let mockRequest: any;
  let mockHost: any;

  beforeEach(() => {
    filter = new AllExceptionsFilter();
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn(),
    };
    mockRequest = {
      method: 'GET',
      url: '/test',
    };
    mockHost = {
      switchToHttp: jest.fn(() => ({
        getResponse: jest.fn(() => mockResponse),
        getRequest: jest.fn(() => mockRequest),
      })),
    };
  });

  it('should handle HttpException', () => {
    const exception = new HttpException('Not Found', HttpStatus.NOT_FOUND);
    filter.catch(exception, mockHost);
    expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.NOT_FOUND);
    expect(mockResponse.send).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: HttpStatus.NOT_FOUND,
        message: 'Not Found',
      }),
    );
  });

  it('should handle non-HttpException as 500', () => {
    const exception = new Error('Unexpected error');
    filter.catch(exception, mockHost);
    expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.INTERNAL_SERVER_ERROR);
    expect(mockResponse.send).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Internal server error',
      }),
    );
  });

  it('should extract message from HttpException response object', () => {
    const exception = new HttpException({ message: 'Custom validation error' }, HttpStatus.BAD_REQUEST);
    filter.catch(exception, mockHost);
    expect(mockResponse.send).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'Custom validation error' }),
    );
  });

  it('should include request path in response', () => {
    const exception = new HttpException('Error', HttpStatus.BAD_REQUEST);
    filter.catch(exception, mockHost);
    expect(mockResponse.send).toHaveBeenCalledWith(
      expect.objectContaining({ path: '/test' }),
    );
  });
});
