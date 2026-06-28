import { Injectable, Logger, ConflictException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class SavedSupplierService {
  private readonly logger = new Logger(SavedSupplierService.name);
  constructor(private readonly prisma: PrismaService) {}

  async findAll(userId: string) {
    return this.prisma.savedSupplier.findMany({
      where: { userId },
      include: {
        company: {
          select: { id: true, name: true, slug: true, logo: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async save(userId: string, companyId: string, notes?: string, tags?: string[]) {
    const existing = await this.prisma.savedSupplier.findUnique({
      where: { userId_companyId: { userId, companyId } },
    });
    if (existing) throw new ConflictException('Supplier already saved');

    return this.prisma.savedSupplier.create({
      data: { userId, companyId, notes, tags: tags ?? [] },
      include: {
        company: {
          select: { id: true, name: true, slug: true, logo: true },
        },
      },
    });
  }

  async update(userId: string, id: string, data: { notes?: string; tags?: string[] }) {
    const entry = await this.prisma.savedSupplier.findFirst({ where: { id, userId } });
    if (!entry) throw new NotFoundException('Saved supplier not found');

    return this.prisma.savedSupplier.update({ where: { id }, data });
  }

  async remove(userId: string, id: string) {
    const entry = await this.prisma.savedSupplier.findFirst({ where: { id, userId } });
    if (!entry) throw new NotFoundException('Saved supplier not found');

    return this.prisma.savedSupplier.delete({ where: { id } });
  }

  async check(userId: string, companyId: string) {
    const entry = await this.prisma.savedSupplier.findUnique({
      where: { userId_companyId: { userId, companyId } },
    });
    return { saved: !!entry, id: entry?.id ?? null };
  }
}
