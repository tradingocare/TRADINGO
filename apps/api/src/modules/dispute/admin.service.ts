import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AdminService {
  private readonly logger = new Logger(AdminService.name);

  constructor(private readonly prisma: PrismaService) {}

  async getAvailableAdmins(): Promise<any[]> {
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

  async getLeastBusyAdmin(): Promise<any> {
    const admins = await this.getAvailableAdmins();
    if (admins.length === 0) return null;

    admins.sort((a, b) => a.activeDisputeCount - b.activeDisputeCount);
    return admins[0];
  }
}
