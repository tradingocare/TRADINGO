import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AuditLogService {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: {
    userId?: string;
    companyId?: string;
    sessionId?: string;
    action: string;
    resource: string;
    outcome?: string;
    previousValue?: Record<string, unknown>;
    newValue?: Record<string, unknown>;
    metadata?: Record<string, unknown>;
    ipAddress?: string;
    userAgent?: string;
    correlationId?: string;
  }) {
    return this.prisma.auditLog.create({
      data: {
        userId: data.userId,
        companyId: data.companyId,
        sessionId: data.sessionId,
        action: data.action,
        resource: data.resource,
        outcome: data.outcome,
        previousValue: data.previousValue as any,
        newValue: data.newValue as any,
        metadata: data.metadata as any,
        ipAddress: data.ipAddress,
        userAgent: data.userAgent,
        correlationId: data.correlationId,
      },
    });
  }

  async findAll(query: {
    page?: number; limit?: number; search?: string;
    action?: string; resource?: string; outcome?: string;
    correlationId?: string; companyId?: string;
  }) {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (query.search) {
      where.OR = [
        { action: { contains: query.search, mode: 'insensitive' } },
        { resource: { contains: query.search, mode: 'insensitive' } },
      ];
    }
    if (query.action) where.action = { contains: query.action, mode: 'insensitive' };
    if (query.resource) where.resource = { contains: query.resource, mode: 'insensitive' };
    if (query.outcome) where.outcome = query.outcome;
    if (query.correlationId) where.correlationId = query.correlationId;
    if (query.companyId) where.companyId = query.companyId;

    const [data, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        include: { user: { select: { id: true, email: true, role: true } } },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.auditLog.count({ where }),
    ]);

    return {
      data: data.map((log) => ({
        id: log.id,
        timestamp: log.createdAt.toISOString(),
        user: log.user?.email || 'system',
        userRole: log.user?.role || 'System',
        action: log.action,
        resource: log.resource,
        outcome: log.outcome,
        previousValue: log.previousValue,
        newValue: log.newValue,
        metadata: log.metadata,
        ipAddress: log.ipAddress,
        userAgent: log.userAgent,
        correlationId: log.correlationId,
        companyId: log.companyId,
        sessionId: log.sessionId,
      })),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrevious: page > 1,
      },
    };
  }
}
