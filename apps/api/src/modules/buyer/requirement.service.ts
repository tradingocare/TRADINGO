import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Priority } from '@prisma/client';

@Injectable()
export class RequirementService {
  private readonly logger = new Logger(RequirementService.name);
  constructor(private readonly prisma: PrismaService) {}

  async findAll(userId: string, status?: string) {
    const where: any = { userId };
    if (status) where.status = status;

    return this.prisma.requirementList.findMany({
      where,
      include: {
        items: { orderBy: { sortOrder: 'asc' } },
        _count: { select: { items: true } },
      },
      orderBy: { updatedAt: 'desc' },
    });
  }

  async getById(userId: string, id: string) {
    const list = await this.prisma.requirementList.findFirst({
      where: { id, userId },
      include: { items: { orderBy: { sortOrder: 'asc' } } },
    });
    if (!list) throw new NotFoundException('Requirement list not found');
    return list;
  }

  async create(userId: string, data: { name: string; description?: string; deadline?: string; priority?: string; items?: any[] }) {
    return this.prisma.requirementList.create({
      data: {
        userId,
        name: data.name,
        description: data.description,
        deadline: data.deadline ? new Date(data.deadline) : undefined,
        priority: (data.priority as Priority) ?? 'MEDIUM',
        items: data.items?.length ? {
          create: data.items.map((item: any, i: number) => ({
            productName: item.productName,
            quantity: item.quantity ?? 1,
            unit: item.unit ?? 'pcs',
            sortOrder: i,
            priority: (item.priority as Priority) ?? 'MEDIUM',
            estimatedBudget: item.estimatedBudget ? Number(item.estimatedBudget) : undefined,
            notes: item.notes,
          })),
        } : undefined,
      },
      include: { items: { orderBy: { sortOrder: 'asc' } } },
    });
  }

  async update(userId: string, id: string, data: { name?: string; description?: string; deadline?: string; priority?: string; status?: string }) {
    const list = await this.prisma.requirementList.findFirst({ where: { id, userId } });
    if (!list) throw new NotFoundException('Requirement list not found');

    return this.prisma.requirementList.update({
      where: { id },
      data: {
        ...data,
        deadline: data.deadline ? new Date(data.deadline) : undefined,
        priority: data.priority as Priority,
        status: data.status as any,
      },
      include: { items: { orderBy: { sortOrder: 'asc' } } },
    });
  }

  async remove(userId: string, id: string) {
    const list = await this.prisma.requirementList.findFirst({ where: { id, userId } });
    if (!list) throw new NotFoundException('Requirement list not found');
    return this.prisma.requirementList.delete({ where: { id } });
  }

  async addItem(userId: string, listId: string, data: { productId?: string; productName: string; quantity?: number; unit?: string; estimatedBudget?: number; notes?: string; priority?: string }) {
    const list = await this.prisma.requirementList.findFirst({ where: { id: listId, userId } });
    if (!list) throw new NotFoundException('Requirement list not found');

    const maxSort = await this.prisma.requirementListItem.aggregate({ where: { listId }, _max: { sortOrder: true } });

    return this.prisma.requirementListItem.create({
      data: {
        listId,
        productId: data.productId,
        productName: data.productName,
        quantity: data.quantity ?? 1,
        unit: data.unit ?? 'pcs',
        sortOrder: (maxSort._max.sortOrder ?? -1) + 1,
        estimatedBudget: data.estimatedBudget ? Number(data.estimatedBudget) : undefined,
        notes: data.notes,
        priority: (data.priority as Priority) ?? 'MEDIUM',
      },
    });
  }

  async updateItem(userId: string, listId: string, itemId: string, data: { productName?: string; quantity?: number; unit?: string; estimatedBudget?: number; notes?: string; priority?: string; sortOrder?: number }) {
    const list = await this.prisma.requirementList.findFirst({ where: { id: listId, userId } });
    if (!list) throw new NotFoundException('Requirement list not found');

    return this.prisma.requirementListItem.update({
      where: { id: itemId },
      data: {
        ...data,
        estimatedBudget: data.estimatedBudget ? Number(data.estimatedBudget) : undefined,
        priority: data.priority as Priority,
      },
    });
  }

  async removeItem(userId: string, listId: string, itemId: string) {
    const list = await this.prisma.requirementList.findFirst({ where: { id: listId, userId } });
    if (!list) throw new NotFoundException('Requirement list not found');
    return this.prisma.requirementListItem.delete({ where: { id: itemId } });
  }
}
