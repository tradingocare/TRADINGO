import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateNoteDto, UpdateNoteDto } from './dto';

@Injectable()
export class CrmNoteService {
  constructor(private readonly prisma: PrismaService) {}

  async create(leadId: string, dto: CreateNoteDto, userId: string) {
    const lead = await this.prisma.crmLead.findUnique({ where: { id: leadId } });
    if (!lead) throw new NotFoundException('Lead not found');
    const note = await this.prisma.crmNote.create({
      data: { leadId, content: dto.content, isPinned: dto.isPinned, mentions: dto.mentions || [], attachments: dto.attachments as any, createdBy: userId },
    });
    await this.prisma.crmTimelineEvent.create({ data: { leadId, type: 'NOTE_ADDED', description: `Note added`, createdBy: userId } });
    return note;
  }

  async update(id: string, dto: UpdateNoteDto) {
    const note = await this.prisma.crmNote.findUnique({ where: { id } });
    if (!note) throw new NotFoundException('Note not found');
    return this.prisma.crmNote.update({ where: { id }, data: { ...dto, attachments: dto.attachments as any } });
  }

  async delete(id: string) {
    const note = await this.prisma.crmNote.findUnique({ where: { id } });
    if (!note) throw new NotFoundException('Note not found');
    return this.prisma.crmNote.delete({ where: { id } });
  }

  async togglePin(id: string) {
    const note = await this.prisma.crmNote.findUnique({ where: { id } });
    if (!note) throw new NotFoundException('Note not found');
    return this.prisma.crmNote.update({ where: { id }, data: { isPinned: !note.isPinned } });
  }

  async listByLead(leadId: string) {
    return this.prisma.crmNote.findMany({ where: { leadId }, orderBy: [{ isPinned: 'desc' }, { createdAt: 'desc' }] });
  }
}
