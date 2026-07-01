import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { PaymentStatus } from '@prisma/client';

@Injectable()
export class RmFinanceService {
  constructor(private readonly prisma: PrismaService) {}

  async getRmDashboard(userId: string) {
    const managedCompanies = await this.prisma.company.findMany({ where: { assignedRmId: userId }, select: { id: true, name: true, trustScore: true } });

    const results = await Promise.all(managedCompanies.map(async company => {
      const [totalOutstanding, overduePayments, collectionNotes] = await Promise.all([
        this.prisma.payment.aggregate({ _sum: { amount: true }, where: { companyId: company.id, status: PaymentStatus.PENDING } }),
        this.prisma.payment.count({ where: { companyId: company.id, status: PaymentStatus.PENDING, createdAt: { lt: new Date(Date.now() - 30 * 86400000) } } }),
        this.prisma.collectionNote.count({ where: { companyId: company.id } }),
      ]);
      return {
        companyId: company.id, companyName: company.name, trustScore: company.trustScore,
        outstanding: Number(totalOutstanding._sum.amount || 0) / 100,
        overduePayments, collectionNotesCount: collectionNotes,
      };
    }));

    const totalOutstanding = results.reduce((s, r) => s + r.outstanding, 0);
    const highRiskBuyers = results.filter(r => r.overduePayments > 2).length;
    const totalCollected = await this.prisma.payment.aggregate({ _sum: { amount: true }, where: { company: { assignedRmId: userId }, status: PaymentStatus.CAPTURED } });

    return {
      managedCompanies: results,
      totalOutstanding,
      highRiskBuyers,
      totalCollected: Number(totalCollected._sum.amount || 0) / 100,
      recoveryRate: totalOutstanding > 0 ? Number((Number(totalCollected._sum.amount || 0) / (totalOutstanding * 100 + Number(totalCollected._sum.amount || 0)) * 100).toFixed(2)) : 0,
    };
  }

  async getCollectionPerformance(userId: string) {
    const managedCompanies = await this.prisma.company.findMany({ where: { assignedRmId: userId }, select: { id: true } });
    const companyIds = managedCompanies.map(c => c.id);

    const [totalPayments, collectedPayments, overduePayments] = await Promise.all([
      this.prisma.payment.count({ where: { companyId: { in: companyIds } } }),
      this.prisma.payment.count({ where: { companyId: { in: companyIds }, status: PaymentStatus.CAPTURED } }),
      this.prisma.payment.count({ where: { companyId: { in: companyIds }, status: PaymentStatus.PENDING, createdAt: { lt: new Date(Date.now() - 30 * 86400000) } } }),
    ]);

    return { totalPayments, collectedPayments, overduePayments, collectionRate: totalPayments > 0 ? Number((collectedPayments / totalPayments * 100).toFixed(2)) : 0 };
  }
}
