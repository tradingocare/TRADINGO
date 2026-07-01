import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { SearchCrmDto } from './dto';

@Injectable()
export class CrmSearchService {
  constructor(private readonly prisma: PrismaService) {}

  async search(dto: SearchCrmDto) {
    const q = dto.q;
    const limit = dto.limit || 20;

    const [companies, leads, users, rfqs, orders] = await Promise.all([
      this.prisma.company.findMany({
        where: { OR: [
          { name: { contains: q, mode: 'insensitive' } },
          { email: { contains: q, mode: 'insensitive' } },
          { mobile: { contains: q, mode: 'insensitive' } },
          { gstNumber: { contains: q, mode: 'insensitive' } },
          { panNumber: { contains: q, mode: 'insensitive' } },
          { slug: { contains: q, mode: 'insensitive' } },
        ] },
        select: { id: true, name: true, slug: true, logo: true, email: true, mobile: true, trustScore: true },
        take: limit,
      }),
      this.prisma.crmLead.findMany({
        where: { OR: [
          { name: { contains: q, mode: 'insensitive' } },
          { email: { contains: q, mode: 'insensitive' } },
          { mobile: { contains: q, mode: 'insensitive' } },
        ] },
        select: { id: true, name: true, email: true, mobile: true, status: true, score: true, companyId: true },
        take: limit,
      }),
      this.prisma.user.findMany({
        where: { OR: [
          { name: { contains: q, mode: 'insensitive' } },
          { email: { contains: q, mode: 'insensitive' } },
          { mobile: { contains: q, mode: 'insensitive' } },
        ] },
        select: { id: true, name: true, email: true, role: true },
        take: limit,
      }),
      this.prisma.rfq.findMany({
        where: { OR: [
          { title: { contains: q, mode: 'insensitive' } },
          { description: { contains: q, mode: 'insensitive' } },
        ] },
        select: { id: true, title: true, status: true, createdAt: true },
        take: limit,
      }),
      this.prisma.order.findMany({
        where: { OR: [
          { orderNumber: { contains: q, mode: 'insensitive' } },
        ] },
        select: { id: true, orderNumber: true, status: true, createdAt: true },
        take: limit,
      }),
    ]);

    return { companies, leads, users, rfqs, orders };
  }
}
