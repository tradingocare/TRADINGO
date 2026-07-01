import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateFollowUpDto, UpdateFollowUpDto } from './dto';

@Injectable()
export class CrmFollowUpService {
  constructor(private readonly prisma: PrismaService) {}

  async create(leadId: string, dto: CreateFollowUpDto, userId: string) {
    const lead = await this.prisma.crmLead.findUnique({ where: { id: leadId } });
    if (!lead) throw new NotFoundException('Lead not found');
    const fu = await this.prisma.crmFollowUp.create({
      data: { leadId, title: dto.title, description: dto.description, dueDate: new Date(dto.dueDate), assignedTo: dto.assignedTo || userId, createdBy: userId },
    });
    await this.prisma.crmTimelineEvent.create({ data: { leadId, type: 'FOLLOW_UP_CREATED', description: `Follow-up: ${dto.title}`, createdBy: userId } });
    return fu;
  }

  async update(id: string, dto: UpdateFollowUpDto) {
    const fu = await this.prisma.crmFollowUp.findUnique({ where: { id } });
    if (!fu) throw new NotFoundException('Follow-up not found');
    return this.prisma.crmFollowUp.update({ where: { id }, data: { ...dto, dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined } });
  }

  async complete(id: string) {
    const fu = await this.prisma.crmFollowUp.findUnique({ where: { id } });
    if (!fu) throw new NotFoundException('Follow-up not found');
    await this.prisma.crmTimelineEvent.create({ data: { leadId: fu.leadId, type: 'FOLLOW_UP_COMPLETED', description: `Follow-up completed: ${fu.title}`, createdBy: fu.createdBy } });
    return this.prisma.crmFollowUp.update({
      where: { id },
      data: { status: 'COMPLETED', completedAt: new Date() },
    });
  }

  async escalate(id: string, escalatedTo: string) {
    const fu = await this.prisma.crmFollowUp.findUnique({ where: { id } });
    if (!fu) throw new NotFoundException('Follow-up not found');
    await this.prisma.crmTimelineEvent.create({ data: { leadId: fu.leadId, type: 'FOLLOW_UP_ESCALATED', description: `Follow-up escalated: ${fu.title}`, createdBy: fu.createdBy } });
    return this.prisma.crmFollowUp.update({
      where: { id },
      data: { status: 'ESCALATED', escalatedTo, escalatedAt: new Date() },
    });
  }

  async listByLead(leadId: string) {
    return this.prisma.crmFollowUp.findMany({ where: { leadId }, orderBy: { dueDate: 'asc' } });
  }

  async listByAssignee(userId: string) {
    return this.prisma.crmFollowUp.findMany({ where: { assignedTo: userId }, orderBy: { dueDate: 'asc' }, include: { lead: { select: { id: true, name: true } } } });
  }

  async getOverdue() {
    return this.prisma.crmFollowUp.findMany({ where: { dueDate: { lt: new Date() }, status: 'PENDING' }, orderBy: { dueDate: 'asc' }, include: { lead: { select: { id: true, name: true } } } });
  }
}
