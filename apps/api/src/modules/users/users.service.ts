import { Injectable, NotFoundException, ForbiddenException, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { Role } from '../../common/enums/role.enum';
import { PaginatedResult } from '../../common/dto/pagination.dto';
import { UserDto, UpdateUserDto, UserFilterDto } from './dto/user.dto';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(private readonly prisma: PrismaService) {}

  async findAll(
    query: UserFilterDto & { cursor?: string; limit?: number },
  ): Promise<PaginatedResult<UserDto>> {
    const { cursor, limit = 20, role, search, createdAfter } = query;

    const where: Prisma.UserWhereInput = { deletedAt: null };
    if (role) where.role = role;
    if (search) {
      where.OR = [
        { email: { contains: search, mode: 'insensitive' } },
        { name: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (createdAfter) {
      where.createdAt = { gte: new Date(createdAfter) };
    }

    const findArgs: Prisma.UserFindManyArgs = {
      where,
      take: limit,
      orderBy: { id: 'asc' },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        permissions: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    };

    if (cursor) {
      findArgs.cursor = { id: cursor };
      findArgs.skip = 1;
    }

    const [data, total] = await Promise.all([
      this.prisma.user.findMany(findArgs),
      this.prisma.user.count({ where }),
    ]);

    return {
      data: data as unknown as UserDto[],
      meta: {
        total,
        page: 1,
        limit,
        totalPages: Math.ceil(total / limit),
        cursor: data.length > 0 ? data[data.length - 1].id : undefined,
      } as PaginatedResult<UserDto>['meta'],
    };
  }

  async findById(id: string): Promise<UserDto> {
    const user = await this.prisma.user.findFirst({
      where: { id, deletedAt: null },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        permissions: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    if (!user) throw new NotFoundException('User not found');
    return user as unknown as UserDto;
  }

  async findByEmail(email: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async update(id: string, dto: UpdateUserDto, requesterId: string): Promise<UserDto> {
    const [requester, target] = await Promise.all([
      this.prisma.user.findUnique({ where: { id: requesterId } }),
      this.prisma.user.findFirst({ where: { id, deletedAt: null } }),
    ]);

    if (!target) throw new NotFoundException('User not found');

    if (requesterId !== id && requester?.role !== Role.ADMIN && requester?.role !== Role.SUPER_ADMIN) {
      throw new ForbiddenException('You can only edit your own profile');
    }

    const updated = await this.prisma.user.update({
      where: { id },
      data: { name: dto.name, permissions: dto.permissions },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        permissions: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    await this.prisma.auditLog.create({
      data: {
        userId: requesterId,
        action: 'UPDATE_USER',
        resource: `user:${id}`,
        metadata: { changes: dto } as unknown as Prisma.InputJsonValue,
      },
    });

    return updated as unknown as UserDto;
  }

  async updateRole(id: string, role: Role, requesterId: string): Promise<UserDto> {
    const user = await this.prisma.user.findFirst({ where: { id, deletedAt: null } });
    if (!user) throw new NotFoundException('User not found');

    const updated = await this.prisma.user.update({
      where: { id },
      data: { role },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        permissions: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    await this.prisma.auditLog.create({
      data: {
        userId: requesterId,
        action: 'UPDATE_USER_ROLE',
        resource: `user:${id}`,
        metadata: { newRole: role },
      },
    });

    return updated as unknown as UserDto;
  }

  async softDelete(id: string, requesterId: string): Promise<void> {
    const user = await this.prisma.user.findFirst({ where: { id, deletedAt: null } });
    if (!user) throw new NotFoundException('User not found');

    await this.prisma.user.update({
      where: { id },
      data: { deletedAt: new Date(), isActive: false },
    });

    await this.prisma.auditLog.create({
      data: {
        userId: requesterId,
        action: 'DELETE_USER',
        resource: `user:${id}`,
        metadata: { deletedUserId: id },
      },
    });

    this.logger.log(`User ${id} soft-deleted by ${requesterId}`);
  }
}
