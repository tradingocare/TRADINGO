import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AdminService {
  private readonly logger = new Logger(AdminService.name);

  constructor(private readonly prisma: PrismaService) {}

  async getAvailableAdmins(): Promise<Record<string, any>[]> {
    const activeDisputes = await this.prisma.dispute.groupBy({
      by: ['assignedAdminId'],
      where: {
        assignedAdminId: { not: null },
        status: 'ADMIN_ARBITRATION',
      },
      _count: { id: true },
    });

    const activeCountMap = new Map<string, number>();
    for (const row of activeDisputes) {
      if (row.assignedAdminId) {
        activeCountMap.set(row.assignedAdminId, row._count.id);
      }
    }

    const admins = await this.prisma.user.findMany({
      where: {
        role: { in: ['ADMIN', 'SUPER_ADMIN'] },
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        email: true,
      },
    });

    return admins.map((admin) => ({
      ...admin,
      activeDisputeCount: activeCountMap.get(admin.id) ?? 0,
    }));
  }

  async getLeastBusyAdmin(): Promise<Record<string, any> | null> {
    const admins = await this.getAvailableAdmins();
    if (admins.length === 0) return null;

    admins.sort((a, b) => a.activeDisputeCount - b.activeDisputeCount);
    return admins[0];
  }

  async listBookingDisputes(params: {
    page?: number; limit?: number; status?: string; type?: string;
  }) {
    const page = Math.max(1, params.page ?? 1);
    const limit = Math.min(100, Math.max(1, params.limit ?? 20));
    const where: any = { bookingId: { not: null } };
    if (params.status) where.status = params.status;
    if (params.type) where.type = params.type;

    const [data, total] = await Promise.all([
      this.prisma.dispute.findMany({
        where,
        include: {
          booking: { select: { id: true, status: true, paymentStatus: true, amount: true } },
          messages: { take: 1, orderBy: { createdAt: 'desc' } },
          raisedByCompany: { select: { id: true, name: true } },
          againstCompany: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.dispute.count({ where }),
    ]);

    return {
      data,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit), hasNext: page * limit < total, hasPrevious: page > 1 },
    };
  }

  async getBookingDisputesStats() {
    const totalBookingDisputes = await this.prisma.dispute.count({ where: { bookingId: { not: null } } });
    const openCount = await this.prisma.dispute.count({
      where: { bookingId: { not: null }, status: { in: ['OPEN', 'UNDER_REVIEW', 'EVIDENCE_PENDING', 'NEGOTIATION'] } },
    });
    const resolvedCount = await this.prisma.dispute.count({
      where: { bookingId: { not: null }, status: { in: ['RESOLVED', 'PARTIALLY_RESOLVED', 'REFUNDED'] } },
    });
    return { totalBookingDisputes, openCount, resolvedCount };
  }
}
