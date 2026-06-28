import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { PaginationDto, buildPaginationQuery, buildPaginatedResult } from '../../common/dto/pagination.dto';

@Injectable()
export class RfqAdminService {
  private readonly logger = new Logger(RfqAdminService.name);
  constructor(private readonly prisma: PrismaService) {}

  async getOverview() {
    const [total, draft, active, expired, cancelled, converted] = await Promise.all([
      this.prisma.rfq.count(),
      this.prisma.rfq.count({ where: { status: 'DRAFT' } }),
      this.prisma.rfq.count({ where: { status: { in: ['ACTIVE', 'MATCHED', 'QUOTED', 'NEGOTIATING'] } } }),
      this.prisma.rfq.count({ where: { status: 'EXPIRED' } }),
      this.prisma.rfq.count({ where: { status: 'CANCELLED' } }),
      this.prisma.rfq.count({ where: { status: 'CONVERTED' } }),
    ]);
    return { total, draft, active, expired, cancelled, converted };
  }

  async getRfqs(status?: string, pagination?: PaginationDto) {
    const where: any = {};
    if (status) where.status = status;

    const query = buildPaginationQuery(pagination || new PaginationDto());
    const [data, total] = await Promise.all([
      this.prisma.rfq.findMany({
        where,
        orderBy: { [query.sort]: query.order } as any,
        take: query.limit,
        skip: query.skip,
        include: {
          company: { select: { id: true, name: true, slug: true } },
          _count: { select: { quotes: true, vendorMatches: true } },
        },
      }),
      this.prisma.rfq.count({ where }),
    ]);
    return buildPaginatedResult(data, total, query);
  }

  async getFlaggedRfqs(pagination?: PaginationDto) {
    const query = buildPaginationQuery(pagination || new PaginationDto());
    const where: any = {
      OR: [
        { description: { contains: 'spam', mode: 'insensitive' as any } },
        { title: { contains: 'spam', mode: 'insensitive' as any } },
      ],
    };
    const [data, total] = await Promise.all([
      this.prisma.rfq.findMany({
        where,
        orderBy: { [query.sort]: query.order } as any,
        take: query.limit,
        skip: query.skip,
        include: { company: { select: { id: true, name: true } } },
      }),
      this.prisma.rfq.count({ where }),
    ]);
    return buildPaginatedResult(data, total, query);
  }

  async getAuditTrail(pagination?: PaginationDto) {
    const query = buildPaginationQuery(pagination || new PaginationDto());
    const [data, total] = await Promise.all([
      this.prisma.rfqAnalyticsEvent.findMany({
        orderBy: { [query.sort]: query.order } as any,
        take: query.limit,
        skip: query.skip,
        include: { rfq: { select: { id: true, rfqNumber: true, title: true } } },
      }),
      this.prisma.rfqAnalyticsEvent.count(),
    ]);
    return buildPaginatedResult(data, total, query);
  }
}
