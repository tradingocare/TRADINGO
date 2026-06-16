import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AdminAssignmentService {
  private readonly logger = new Logger(AdminAssignmentService.name);

  // Round-robin index, persisted per admin
  private roundRobinIndex = 0;

  constructor(private readonly prisma: PrismaService) {}

  async assignArbitrator(disputeId: string): Promise<{ adminId: string; reason: string }> {
    const availableAdmins = await this.getAvailableAdmins();
    if (availableAdmins.length === 0) {
      this.logger.warn('No available admins for arbitration assignment');
      throw new Error('No available admins');
    }

    const leastBusy = this.getLeastBusyFromList(availableAdmins);
    const roundRobin = this.getNextRoundRobin(availableAdmins);

    const admin = leastBusy.activeDisputeCount <= roundRobin.activeDisputeCount
      ? leastBusy
      : roundRobin;

    await this.recordAssignment(disputeId, admin.id, admin.activeDisputeCount);

    this.logger.log(`Assigned admin ${admin.id} to dispute ${disputeId} via ${admin.reason}`);
    return { adminId: admin.id, reason: admin.reason };
  }

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
      id: admin.id,
      name: admin.name,
      email: admin.email,
      activeDisputeCount: activeCountMap.get(admin.id) ?? 0,
    }));
  }

  async getLeastBusyAdmin(): Promise<any> {
    const admins = await this.getAvailableAdmins();
    if (admins.length === 0) return null;
    return this.getLeastBusyFromList(admins);
  }

  async recordAssignment(disputeId: string, adminId: string, currentLoad: number): Promise<void> {
    this.logger.log(`Assignment recorded: admin ${adminId} for dispute ${disputeId} (load: ${currentLoad})`);

    await this.prisma.disputeTimelineEvent.create({
      data: {
        disputeId,
        type: 'ARBITRATOR_ASSIGNED',
        description: `Admin ${adminId} assigned (round-robin, load: ${currentLoad})`,
        createdBy: 'system',
        metadata: { adminId, currentLoad } as any,
      },
    });
  }

  private getLeastBusyFromList(admins: any[]): any {
    const sorted = [...admins].sort((a, b) => a.activeDisputeCount - b.activeDisputeCount);
    return { ...sorted[0], reason: 'least-active' };
  }

  private getNextRoundRobin(admins: any[]): any {
    const index = this.roundRobinIndex % admins.length;
    this.roundRobinIndex = (this.roundRobinIndex + 1) % admins.length;
    return { ...admins[index], reason: 'round-robin' };
  }
}
