import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class CompanyOwnerGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    if (!user) throw new ForbiddenException('No user context');

    const companyId = request.params.id || request.params.companyId;
    if (!companyId) throw new ForbiddenException('Company ID not found in request');

    if (user.role === 'SUPER_ADMIN' || user.role === 'ADMIN') return true;

    const owner = await this.prisma.companyOwner.findUnique({
      where: { companyId_userId: { companyId, userId: user.sub } },
      select: { id: true },
    });
    if (!owner) throw new ForbiddenException('You are not an owner of this company');

    return true;
  }
}
