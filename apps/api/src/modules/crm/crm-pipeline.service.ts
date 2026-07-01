import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreatePipelineStageDto, UpdatePipelineStageDto } from './dto';

@Injectable()
export class CrmPipelineService {
  constructor(private readonly prisma: PrismaService) {}

  async getStages() {
    return this.prisma.crmPipelineStage.findMany({ orderBy: { order: 'asc' }, include: { _count: { select: { leads: true } } } });
  }

  async createStage(dto: CreatePipelineStageDto) {
    const existing = await this.prisma.crmPipelineStage.findUnique({ where: { name: dto.name } });
    if (existing) throw new BadRequestException('Stage with this name already exists');
    const maxOrder = await this.prisma.crmPipelineStage.aggregate({ _max: { order: true } });
    return this.prisma.crmPipelineStage.create({
      data: { name: dto.name, order: dto.order ?? (maxOrder._max.order ?? -1) + 1, color: dto.color, isDefault: dto.isDefault, isWon: dto.isWon, isLost: dto.isLost },
    });
  }

  async updateStage(id: string, dto: UpdatePipelineStageDto) {
    const stage = await this.prisma.crmPipelineStage.findUnique({ where: { id } });
    if (!stage) throw new NotFoundException('Stage not found');
    return this.prisma.crmPipelineStage.update({ where: { id }, data: dto });
  }

  async deleteStage(id: string) {
    const stage = await this.prisma.crmPipelineStage.findUnique({ where: { id }, include: { _count: { select: { leads: true } } } });
    if (!stage) throw new NotFoundException('Stage not found');
    if (stage._count.leads > 0) throw new BadRequestException('Cannot delete stage with active leads. Move leads first.');
    return this.prisma.crmPipelineStage.delete({ where: { id } });
  }

  async reorderStages(order: string[]) {
    await Promise.all(order.map((id, idx) => this.prisma.crmPipelineStage.update({ where: { id }, data: { order: idx } })));
    return this.getStages();
  }
}
