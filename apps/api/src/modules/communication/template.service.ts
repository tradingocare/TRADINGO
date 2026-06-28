import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class TemplateService {
  private readonly logger = new Logger(TemplateService.name);
  constructor(private readonly prisma: PrismaService) {}

  async findAll(companyId: string, category?: string) {
    const where: any = { companyId };
    if (category) where.category = category;
    return this.prisma.savedTemplate.findMany({ where, orderBy: { updatedAt: 'desc' } });
  }

  async create(companyId: string, data: { title: string; content: string; category?: string; isShared?: boolean }) {
    return this.prisma.savedTemplate.create({ data: { companyId, ...data } });
  }

  async update(id: string, companyId: string, data: { title?: string; content?: string; category?: string; isShared?: boolean }) {
    const tpl = await this.prisma.savedTemplate.findFirst({ where: { id, companyId } });
    if (!tpl) throw new NotFoundException('Template not found');
    return this.prisma.savedTemplate.update({ where: { id }, data });
  }

  async remove(id: string, companyId: string) {
    const tpl = await this.prisma.savedTemplate.findFirst({ where: { id, companyId } });
    if (!tpl) throw new NotFoundException('Template not found');
    return this.prisma.savedTemplate.delete({ where: { id } });
  }
}
