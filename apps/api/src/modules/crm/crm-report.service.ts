import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CrmLeadStatus, CrmFollowUpStatus } from '@prisma/client';

@Injectable()
export class CrmReportService {
  constructor(private readonly prisma: PrismaService) {}

  async leadConversion() {
    const total = await this.prisma.crmLead.count();
    const won = await this.prisma.crmLead.count({ where: { status: CrmLeadStatus.WON } });
    const lost = await this.prisma.crmLead.count({ where: { status: CrmLeadStatus.LOST } });
    return { total, won, lost, conversionRate: total > 0 ? Number((won / total * 100).toFixed(2)) : 0 };
  }

  async winRate() {
    const closed = await this.prisma.crmLead.count({ where: { OR: [{ status: CrmLeadStatus.WON }, { status: CrmLeadStatus.LOST }] } });
    const won = await this.prisma.crmLead.count({ where: { status: CrmLeadStatus.WON } });
    return { closed, won, winRate: closed > 0 ? Number((won / closed * 100).toFixed(2)) : 0 };
  }

  async lostReasons() {
    const lostLeads = await this.prisma.crmLead.findMany({
      where: { status: CrmLeadStatus.LOST, lostReason: { not: null } },
      select: { lostReason: true },
    });
    const reasonCount: Record<string, number> = {};
    lostLeads.forEach(l => { const r = l.lostReason || 'Unknown'; reasonCount[r] = (reasonCount[r] || 0) + 1; });
    return Object.entries(reasonCount).map(([reason, count]) => ({ reason, count })).sort((a, b) => b.count - a.count);
  }

  async pipelineValue() {
    const stages = await this.prisma.crmPipelineStage.findMany({
      orderBy: { order: 'asc' },
      include: { _count: { select: { leads: true } }, leads: { select: { estimatedValue: true } } },
    });
    return stages.map(s => ({
      name: s.name,
      count: s._count.leads,
      value: Number(s.leads.reduce((sum, l) => sum + Number(l.estimatedValue || 0), 0)),
    }));
  }

  async followUpEfficiency() {
    const total = await this.prisma.crmFollowUp.count();
    const completed = await this.prisma.crmFollowUp.count({ where: { status: CrmFollowUpStatus.COMPLETED } });
    const overdue = await this.prisma.crmFollowUp.count({ where: { dueDate: { lt: new Date() }, status: CrmFollowUpStatus.PENDING } });
    return { total, completed, overdue, completionRate: total > 0 ? Number((completed / total * 100).toFixed(2)) : 0 };
  }

  async rmPerformance() {
    const users = await this.prisma.user.findMany({
      where: { managedCompanies: { some: {} } },
      select: {
        id: true, name: true, email: true,
        _count: { select: { managedCompanies: true, crmLeads: true } },
      },
    });
    const performance = await Promise.all(users.map(async u => {
      const wonLeads = await this.prisma.crmLead.count({ where: { ownerId: u.id, status: CrmLeadStatus.WON } });
      const totalLeads = u._count.crmLeads;
      return {
        rmId: u.id, rmName: u.name, rmEmail: u.email,
        managedCompanies: u._count.managedCompanies,
        totalLeads,
        wonLeads,
        conversionRate: totalLeads > 0 ? Number((wonLeads / totalLeads * 100).toFixed(2)) : 0,
      };
    }));
    return performance.sort((a, b) => b.conversionRate - a.conversionRate);
  }

  async responseTime() {
    const leads = await this.prisma.crmLead.findMany({
      where: { createdAt: { gte: new Date(Date.now() - 90 * 86400000) } },
      select: { createdAt: true, timeline: { where: { type: 'LEAD_UPDATED' }, select: { createdAt: true }, take: 1, orderBy: { createdAt: 'asc' } } },
      take: 500,
    });
    const times = leads
      .filter(l => l.timeline.length > 0)
      .map(l => l.timeline[0].createdAt.getTime() - l.createdAt.getTime())
      .filter(t => t > 0);
    const avgResponseTime = times.length > 0 ? Math.round(times.reduce((a, b) => a + b, 0) / times.length / 3600000) : 0;
    return { averageResponseHours: avgResponseTime, totalTracked: times.length };
  }
}
