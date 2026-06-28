import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class LabelService {
  private readonly logger = new Logger(LabelService.name);
  constructor(private readonly prisma: PrismaService) {}

  async findAll(companyId: string) {
    return this.prisma.conversationLabel.findMany({ where: { companyId }, orderBy: { name: 'asc' } });
  }

  async create(companyId: string, data: { name: string; color?: string }) {
    return this.prisma.conversationLabel.create({ data: { companyId, name: data.name, color: data.color ?? '#6366f1' } });
  }

  async update(id: string, companyId: string, data: { name?: string; color?: string }) {
    const label = await this.prisma.conversationLabel.findFirst({ where: { id, companyId } });
    if (!label) throw new NotFoundException('Label not found');
    return this.prisma.conversationLabel.update({ where: { id }, data });
  }

  async remove(id: string, companyId: string) {
    const label = await this.prisma.conversationLabel.findFirst({ where: { id, companyId } });
    if (!label) throw new NotFoundException('Label not found');
    return this.prisma.conversationLabel.delete({ where: { id } });
  }

  async assignLabel(conversationId: string, labelId: string) {
    return this.prisma.conversationLabelAssignment.upsert({
      where: { conversationId_labelId: { conversationId, labelId } },
      create: { conversationId, labelId },
      update: {},
    });
  }

  async removeLabel(conversationId: string, labelId: string) {
    return this.prisma.conversationLabelAssignment.delete({
      where: { conversationId_labelId: { conversationId, labelId } },
    });
  }
}
