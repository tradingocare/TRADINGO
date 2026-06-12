import { RolesGuard } from './roles.guard';
import { ForbiddenException } from '@nestjs/common';

describe('RolesGuard', () => {
  let guard: RolesGuard;
  let reflector: { getAllAndOverride: jest.Mock };
  let mockContext: any;

  beforeEach(() => {
    reflector = { getAllAndOverride: jest.fn() };
    guard = new RolesGuard(reflector as any);
    mockContext = {
      getHandler: jest.fn(),
      getClass: jest.fn(),
      switchToHttp: jest.fn(() => ({
        getRequest: jest.fn(() => ({ user: { role: 'ADMIN' } })),
      })),
    };
  });

  describe('canActivate', () => {
    it('should return true when no roles required', () => {
      reflector.getAllAndOverride.mockReturnValue(undefined);
      expect(guard.canActivate(mockContext as any)).toBe(true);
    });

    it('should return true when user has required role', () => {
      reflector.getAllAndOverride.mockReturnValue(['ADMIN']);
      expect(guard.canActivate(mockContext as any)).toBe(true);
    });

    it('should throw ForbiddenException when user does not have required role', () => {
      reflector.getAllAndOverride.mockReturnValue(['SUPER_ADMIN']);
      expect(() => guard.canActivate(mockContext as any)).toThrow(ForbiddenException);
    });

    it('should throw ForbiddenException when no user context', () => {
      reflector.getAllAndOverride.mockReturnValue(['ADMIN']);
      mockContext.switchToHttp = jest.fn(() => ({
        getRequest: jest.fn(() => ({})),
      }));
      expect(() => guard.canActivate(mockContext as any)).toThrow(ForbiddenException);
    });

    it('should return true when empty roles array', () => {
      reflector.getAllAndOverride.mockReturnValue([]);
      expect(guard.canActivate(mockContext as any)).toBe(true);
    });
  });
});
