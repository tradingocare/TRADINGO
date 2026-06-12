import { JwtAuthGuard } from './jwt-auth.guard';
import { UnauthorizedException } from '@nestjs/common';

describe('JwtAuthGuard', () => {
  let guard: JwtAuthGuard;
  let reflector: { getAllAndOverride: jest.Mock };
  let mockContext: any;

  beforeEach(() => {
    reflector = { getAllAndOverride: jest.fn() };
    guard = new JwtAuthGuard(reflector as any);
    mockContext = {
      getHandler: jest.fn(),
      getClass: jest.fn(),
      switchToHttp: jest.fn(() => ({
        getRequest: jest.fn(() => ({})),
        getResponse: jest.fn(() => ({})),
      })),
    };
  });

  describe('canActivate', () => {
    it('should return true for public routes', () => {
      reflector.getAllAndOverride.mockReturnValue(true);
      const result = guard.canActivate(mockContext as any);
      expect(result).toBe(true);
    });

    it('should call super.canActivate for non-public routes', () => {
      reflector.getAllAndOverride.mockReturnValue(false);
      const canActivateSpy = jest.spyOn(JwtAuthGuard.prototype as any, 'canActivate').mockReturnValue(false);
      guard.canActivate(mockContext as any);
      canActivateSpy.mockRestore();
    });
  });

  describe('handleRequest', () => {
    it('should return user when valid', () => {
      const user = { id: '1', role: 'USER' };
      expect(guard.handleRequest(null, user)).toBe(user);
    });

    it('should throw UnauthorizedException when no user', () => {
      expect(() => guard.handleRequest(null, false)).toThrow(UnauthorizedException);
    });

    it('should throw the original error', () => {
      const err = new Error('test error');
      expect(() => guard.handleRequest(err, false)).toThrow(err);
    });
  });
});
