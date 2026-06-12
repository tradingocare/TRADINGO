import { PermissionsGuard } from './permissions.guard';
import { ForbiddenException } from '@nestjs/common';

describe('PermissionsGuard', () => {
  let guard: PermissionsGuard;
  let reflector: { getAllAndOverride: jest.Mock };
  let mockContext: any;

  beforeEach(() => {
    reflector = { getAllAndOverride: jest.fn() };
    guard = new PermissionsGuard(reflector as any);
    mockContext = {
      getHandler: jest.fn(),
      getClass: jest.fn(),
      switchToHttp: jest.fn(() => ({
        getRequest: jest.fn(() => ({ user: { role: 'ADMIN', permissions: ['read:users'] } })),
      })),
    };
  });

  describe('canActivate', () => {
    it('should return true when no permissions required', () => {
      reflector.getAllAndOverride.mockReturnValue(undefined);
      expect(guard.canActivate(mockContext as any)).toBe(true);
    });

    it('should return true when user has required permission', () => {
      reflector.getAllAndOverride.mockReturnValue(['read:users']);
      expect(guard.canActivate(mockContext as any)).toBe(true);
    });

    it('should bypass permission check for SUPER_ADMIN', () => {
      mockContext.switchToHttp = jest.fn(() => ({
        getRequest: jest.fn(() => ({ user: { role: 'SUPER_ADMIN', permissions: [] } })),
      }));
      reflector.getAllAndOverride.mockReturnValue(['read:users']);
      expect(guard.canActivate(mockContext as any)).toBe(true);
    });

    it('should throw ForbiddenException when missing permissions', () => {
      reflector.getAllAndOverride.mockReturnValue(['write:admin']);
      expect(() => guard.canActivate(mockContext as any)).toThrow(ForbiddenException);
    });

    it('should throw ForbiddenException when no user context', () => {
      reflector.getAllAndOverride.mockReturnValue(['read:users']);
      mockContext.switchToHttp = jest.fn(() => ({
        getRequest: jest.fn(() => ({})),
      }));
      expect(() => guard.canActivate(mockContext as any)).toThrow(ForbiddenException);
    });

    it('should return true when empty permissions array', () => {
      reflector.getAllAndOverride.mockReturnValue([]);
      expect(guard.canActivate(mockContext as any)).toBe(true);
    });
  });
});
