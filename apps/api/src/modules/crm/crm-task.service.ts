import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateTaskDto, UpdateTaskDto } from './dto';

@Injectable()
export class CrmTaskService {
  constructor(private readonly prisma: PrismaService) {}

  async create(leadId: string, dto: CreateTaskDto, userId: string) {
    const lead = await this.prisma.crmLead.findUnique({ where: { id: leadId } });
    if (!lead) throw new NotFoundException('Lead not found');
    const task = await this.prisma.crmTask.create({
      data: { leadId, type: dto.type, title: dto.title, description: dto.description, dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined, assignedTo: dto.assignedTo || userId, createdBy: userId },
    });
    await this.prisma.crmTimelineEvent.create({ data: { leadId, type: 'TASK_CREATED', description: `Task: ${dto.title}`, createdBy: userId } });
    return task;
  }

  async update(id: string, dto: UpdateTaskDto) {
    const task = await this.prisma.crmTask.findUnique({ where: { id } });
    if (!task) throw new NotFoundException('Task not found');
    return this.prisma.crmTask.update({ where: { id }, data: { ...dto, dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined } });
  }

  async complete(id: string) {
    const task = await this.prisma.crmTask.findUnique({ where: { id } });
    if (!task) throw new NotFoundException('Task not found');
    await this.prisma.crmTimelineEvent.create({ data: { leadId: task.leadId, type: 'TASK_COMPLETED', description: `Task completed: ${task.title}`, createdBy: task.createdBy } });
    return this.prisma.crmTask.update({
      where: { id },
      data: { status: 'COMPLETED', completedAt: new Date() },
    });
  }

  async listByLead(leadId: string) {
    return this.prisma.crmTask.findMany({ where: { leadId }, orderBy: [{ status: 'asc' }, { dueDate: 'asc' }] });
  }

  async listByAssignee(userId: string) {
    return this.prisma.crmTask.findMany({ where: { assignedTo: userId }, orderBy: { dueDate: 'asc' }, include: { lead: { select: { id: true, name: true } } } });
  }
}
