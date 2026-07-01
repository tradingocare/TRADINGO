import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { TradTrustService } from '../tradtrust/tradtrust.service';
import { CreateLeadDto, UpdateLeadDto, QueryLeadDto } from './dto';
import { CrmLeadStatus, Prisma } from '@prisma/client';

@Injectable()
export class CrmService {
  private readonly logger = new Logger(CrmService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly tradTrustService: TradTrustService,
  ) {}

  async createLead(dto: CreateLeadDto, userId: string) {
    const ownerId = dto.ownerId || userId;
    let score = dto.score || 0;
    if (dto.companyId && score === 0) {
      try {
        const trustData = await this.tradTrustService.getScore(dto.companyId);
        score = trustData?.score || 0;
      } catch { /* use default */ }
    }

    return this.prisma.crmLead.create({
      data: {
        companyId: dto.companyId,
        name: dto.name,
        email: dto.email,
        mobile: dto.mobile,
        source: dto.source,
        status: dto.status || CrmLeadStatus.NEW,
        stageId: dto.stageId,
        priority: dto.priority,
        ownerId,
        score,
        estimatedValue: dto.estimatedValue ? new Prisma.Decimal(dto.estimatedValue) : undefined,
        description: dto.description,
        metadata: dto.metadata as any,
        timeline: { create: { type: 'LEAD_CREATED', description: `Lead created: ${dto.name}`, createdBy: userId } },
      },
      include: { company: { select: { id: true, name: true, slug: true, logo: true } }, owner: { select: { id: true, name: true, email: true } }, stage: true },
    });
  }

  async listLeads(query: QueryLeadDto) {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const skip = (page - 1) * limit;
    const where: Prisma.CrmLeadWhereInput = {};

    if (query.search) {
      where.OR = [
        { name: { contains: query.search, mode: 'insensitive' } },
        { email: { contains: query.search, mode: 'insensitive' } },
        { mobile: { contains: query.search, mode: 'insensitive' } },
        { description: { contains: query.search, mode: 'insensitive' } },
      ];
    }
    if (query.status) where.status = query.status;
    if (query.priority) where.priority = query.priority;
    if (query.source) where.source = query.source;
    if (query.ownerId) where.ownerId = query.ownerId;
    if (query.stageId) where.stageId = query.stageId;
    if (query.companyId) where.companyId = query.companyId;

    const orderBy: Prisma.CrmLeadOrderByWithRelationInput = {};
    if (query.sortBy) {
      orderBy[query.sortBy as keyof Prisma.CrmLeadOrderByWithRelationInput] = query.sortOrder || 'desc';
    } else {
      orderBy.createdAt = 'desc';
    }

    const [data, total] = await Promise.all([
      this.prisma.crmLead.findMany({
        where, skip, take: limit, orderBy,
        include: { company: { select: { id: true, name: true, slug: true, logo: true } }, owner: { select: { id: true, name: true } }, stage: true },
      }),
      this.prisma.crmLead.count({ where }),
    ]);

    return { data, meta: { total, page, limit, totalPages: Math.ceil(total / limit), hasNext: page * limit < total, hasPrevious: page > 1 } };
  }

  async getLead(id: string) {
    const lead = await this.prisma.crmLead.findUnique({
      where: { id },
      include: {
        company: { select: { id: true, name: true, slug: true, logo: true, trustScore: true, verificationLevel: true, status: true, email: true, mobile: true } },
        owner: { select: { id: true, name: true, email: true } },
        stage: true,
        followUps: { orderBy: { dueDate: 'asc' } },
        notes: { orderBy: { createdAt: 'desc' }, take: 50 },
        tasks: { orderBy: { dueDate: 'asc' } },
        timeline: { orderBy: { createdAt: 'desc' }, take: 100 },
      },
    });
    if (!lead) throw new NotFoundException('Lead not found');
    return lead;
  }

  async updateLead(id: string, dto: UpdateLeadDto) {
    const lead = await this.prisma.crmLead.findUnique({ where: { id } });
    if (!lead) throw new NotFoundException('Lead not found');

    const data: any = {};
    const timelineEvents: string[] = [];

    if (dto.name !== undefined) { data.name = dto.name; timelineEvents.push(`Name changed to: ${dto.name}`); }
    if (dto.email !== undefined) data.email = dto.email;
    if (dto.mobile !== undefined) data.mobile = dto.mobile;
    if (dto.source !== undefined) { data.source = dto.source; timelineEvents.push(`Source changed to: ${dto.source}`); }
    if (dto.status !== undefined) { data.status = dto.status; timelineEvents.push(`Status changed to: ${dto.status}`); }
    if (dto.stageId !== undefined) data.stageId = dto.stageId;
    if (dto.priority !== undefined) { data.priority = dto.priority; timelineEvents.push(`Priority changed to: ${dto.priority}`); }
    if (dto.ownerId !== undefined) data.ownerId = dto.ownerId;
    if (dto.score !== undefined) data.score = dto.score;
    if (dto.estimatedValue !== undefined) data.estimatedValue = new Prisma.Decimal(dto.estimatedValue);
    if (dto.description !== undefined) data.description = dto.description;
    if (dto.lostReason !== undefined) data.lostReason = dto.lostReason;
    if (dto.metadata !== undefined) data.metadata = dto.metadata as any;

    if (dto.status === CrmLeadStatus.WON && lead.status !== CrmLeadStatus.WON) {
      data.convertedAt = new Date();
      timelineEvents.push('Lead converted (Won)');
    }
    if (dto.status === CrmLeadStatus.LOST) {
      data.lostReason = dto.lostReason || lead.lostReason;
      timelineEvents.push(`Lead lost: ${data.lostReason || 'No reason'}`);
    }

    if (timelineEvents.length > 0) {
      data.timeline = {
        create: timelineEvents.map(desc => ({ type: 'LEAD_UPDATED', description: desc, createdBy: lead.ownerId })),
      };
    }

    return this.prisma.crmLead.update({
      where: { id },
      data,
      include: { company: { select: { id: true, name: true, slug: true, logo: true } }, owner: { select: { id: true, name: true } }, stage: true },
    });
  }

  async deleteLead(id: string) {
    const lead = await this.prisma.crmLead.findUnique({ where: { id } });
    if (!lead) throw new NotFoundException('Lead not found');
    return this.prisma.crmLead.delete({ where: { id } });
  }

  async convertLead(id: string, companyId?: string) {
    const lead = await this.prisma.crmLead.findUnique({ where: { id } });
    if (!lead) throw new NotFoundException('Lead not found');
    if (lead.status === CrmLeadStatus.WON) throw new BadRequestException('Lead already converted');

    return this.prisma.crmLead.update({
      where: { id },
      data: {
        status: CrmLeadStatus.WON,
        convertedAt: new Date(),
        convertedCompanyId: companyId || lead.companyId,
        timeline: { create: { type: 'LEAD_CONVERTED', description: 'Lead converted to customer', createdBy: lead.ownerId } },
      },
    });
  }

  async markLost(id: string, reason: string) {
    const lead = await this.prisma.crmLead.findUnique({ where: { id } });
    if (!lead) throw new NotFoundException('Lead not found');
    if (!reason) throw new BadRequestException('Lost reason is required');

    return this.prisma.crmLead.update({
      where: { id },
      data: {
        status: CrmLeadStatus.LOST,
        lostReason: reason,
        timeline: { create: { type: 'LEAD_LOST', description: `Lead lost: ${reason}`, createdBy: lead.ownerId } },
      },
    });
  }

  async reassignLead(id: string, ownerId: string) {
    const lead = await this.prisma.crmLead.findUnique({ where: { id } });
    if (!lead) throw new NotFoundException('Lead not found');
    const user = await this.prisma.user.findUnique({ where: { id: ownerId }, select: { id: true, name: true } });
    if (!user) throw new NotFoundException('User not found');

    return this.prisma.crmLead.update({
      where: { id },
      data: {
        ownerId,
        timeline: { create: { type: 'LEAD_REASSIGNED', description: `Reassigned to: ${user.name}`, createdBy: lead.ownerId } },
      },
    });
  }

  async recalculateScore(id: string) {
    const lead = await this.prisma.crmLead.findUnique({ where: { id }, include: { company: true } });
    if (!lead) throw new NotFoundException('Lead not found');
    let score = 0;
    if (lead.companyId) {
      try {
        const trustData = await this.tradTrustService.getScore(lead.companyId);
        score = trustData?.score || 0;
      } catch { /* use default */ }
    }
    if (lead.estimatedValue) score += Math.min(Number(lead.estimatedValue) / 10000, 200);
    return this.prisma.crmLead.update({ where: { id }, data: { score } });
  }

  async getSellerDashboard(companyId: string) {
    const [totalLeads, won, lost, active, followUps, tasks] = await Promise.all([
      this.prisma.crmLead.count({ where: { companyId } }),
      this.prisma.crmLead.count({ where: { companyId, status: CrmLeadStatus.WON } }),
      this.prisma.crmLead.count({ where: { companyId, status: CrmLeadStatus.LOST } }),
      this.prisma.crmLead.count({ where: { companyId, status: { notIn: [CrmLeadStatus.WON, CrmLeadStatus.LOST] } } }),
      this.prisma.crmFollowUp.count({ where: { lead: { companyId }, status: 'PENDING' } }),
      this.prisma.crmTask.count({ where: { lead: { companyId }, status: 'PENDING' } }),
    ]);
    return { totalLeads, won, lost, active, pendingFollowUps: followUps, pendingTasks: tasks };
  }

  async getRmDashboard(userId: string) {
    const [managedCompanies, leads, followUps, tasks] = await Promise.all([
      this.prisma.company.count({ where: { assignedRmId: userId } }),
      this.prisma.crmLead.count({ where: { ownerId: userId } }),
      this.prisma.crmFollowUp.count({ where: { assignedTo: userId, status: 'PENDING' } }),
      this.prisma.crmTask.count({ where: { assignedTo: userId, status: 'PENDING' } }),
    ]);
    return { managedCompanies, totalLeads: leads, pendingFollowUps: followUps, pendingTasks: tasks };
  }

  async getAdminDashboard() {
    const [totalLeads, byStatus, bySource, pipelineValue] = await Promise.all([
      this.prisma.crmLead.count(),
      this.prisma.crmLead.groupBy({ by: ['status'], _count: true }),
      this.prisma.crmLead.groupBy({ by: ['source'], _count: true, where: { source: { not: null } } }),
      this.prisma.crmLead.aggregate({ _sum: { estimatedValue: true }, where: { status: { notIn: [CrmLeadStatus.WON, CrmLeadStatus.LOST] } } }),
    ]);
    return { totalLeads, byStatus: byStatus.map(s => ({ status: s.status, count: s._count })), bySource: bySource.map(s => ({ source: s.source, count: s._count })), pipelineValue: Number(pipelineValue._sum.estimatedValue || 0) };
  }
}
