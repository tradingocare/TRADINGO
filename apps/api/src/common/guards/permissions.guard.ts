import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PERMISSIONS_KEY } from '../decorators/permissions.decorator';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredPermissions = this.reflector.getAllAndOverride<string[]>(PERMISSIONS_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest();
    if (!user) {
      throw new ForbiddenException('No user context');
    }

    // SUPER_ADMIN bypasses all permission checks
    if (user.role === 'SUPER_ADMIN') {
      return true;
    }

    // OR logic: user needs at least one of the required permissions
    const userPermissions: string[] = user.permissions || [];
    const hasPermission = requiredPermissions.some((perm) => userPermissions.includes(perm));
    if (!hasPermission) {
      throw new ForbiddenException('Missing required permissions');
    }

    return true;
  }
}
