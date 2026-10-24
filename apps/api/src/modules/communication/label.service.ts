import { Injectable, Logger, NotFoundException, ForbiddenException, BadRequestException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class LabelService {
  private readonly logger = new Logger(LabelService.name);
  constructor(private readonly prisma: PrismaService) {}

  async findAll(companyId: string) {
    return this.prisma.conversationLabel.findMany({ where: { companyId }, orderBy: { name: 'asc' } });
  }

  async create(companyId: string, data: { name: string; color?: string }) {
    if (!data.name?.trim()) throw new BadRequestException('Label name is required');
    const existing = await this.prisma.conversationLabel.findFirst({ where: { companyId, name: data.name.trim() } });
    if (existing) throw new ConflictException('Label already exists');
    return this.prisma.conversationLabel.create({ data: { companyId, name: data.name.trim(), color: data.color ?? '#6366f1' } });
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

  // P1-02 Part 3 — label assignment is participant-gated and tenant-scoped:
  // the caller must participate in the conversation, and the label must
  // belong to the caller's company (blocks cross-company label pollution by
  // ID guessing). Assign stays idempotent via upsert.
  async assignLabel(conversationId: string, labelId: string, userId: string, companyId: string) {
    const isParticipant = await this.prisma.conversationParticipant.findUnique({
      where: { conversationId_userId: { conversationId, userId } },
    });
    if (!isParticipant) throw new ForbiddenException('Not a participant');
    const label = await this.prisma.conversationLabel.findFirst({ where: { id: labelId, companyId } });
    if (!label) throw new NotFoundException('Label not found');
    return this.prisma.conversationLabelAssignment.upsert({
      where: { conversationId_labelId: { conversationId, labelId } },
      create: { conversationId, labelId },
      update: {},
    });
  }

  async removeLabel(conversationId: string, labelId: string, userId: string) {
    const isParticipant = await this.prisma.conversationParticipant.findUnique({
      where: { conversationId_userId: { conversationId, userId } },
    });
    if (!isParticipant) throw new ForbiddenException('Not a participant');
    const assignment = await this.prisma.conversationLabelAssignment.findUnique({
      where: { conversationId_labelId: { conversationId, labelId } },
    });
    if (!assignment) throw new NotFoundException('Label assignment not found');
    return this.prisma.conversationLabelAssignment.delete({
      where: { conversationId_labelId: { conversationId, labelId } },
    });
  }
}
