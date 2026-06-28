import { Injectable, Logger, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { PaginationDto, buildPaginationQuery, buildPaginatedResult } from '../../common/dto/pagination.dto';

@Injectable()
export class RfqSellerService {
  private readonly logger = new Logger(RfqSellerService.name);
  constructor(private readonly prisma: PrismaService) {}

  async getIncomingRfqs(companyId: string, status?: string, pagination?: PaginationDto) {
    const where: any = { deletedAt: null, status: { not: 'DRAFT' } };
    if (status) where.status = status;
    if (status !== 'MATCHED') {
      where.vendorMatches = { some: { companyId } };
    }

    const query = buildPaginationQuery(pagination || new PaginationDto());
    const [data, total] = await Promise.all([
      this.prisma.rfq.findMany({
        where,
        orderBy: { [query.sort]: query.order } as any,
        take: query.limit,
        skip: query.skip,
        include: {
          locations: true,
          productItems: true,
          company: { select: { id: true, name: true, slug: true, logo: true } },
          vendorMatches: { where: { companyId }, select: { status: true, matchScore: true, viewedAt: true } },
        },
      }),
      this.prisma.rfq.count({ where }),
    ]);
    return buildPaginatedResult(data, total, query);
  }

  async acceptRfq(rfqId: string, companyId: string) {
    const match = await this.prisma.rfqVendorMatch.findUnique({
      where: { rfqId_companyId: { rfqId, companyId } },
    });
    if (!match) throw new NotFoundException('Match not found');

    return this.prisma.rfqVendorMatch.update({
      where: { id: match.id },
      data: { status: 'QUOTED', viewedAt: new Date() },
    });
  }

  async declineRfq(rfqId: string, companyId: string, reason?: string) {
    const match = await this.prisma.rfqVendorMatch.findUnique({
      where: { rfqId_companyId: { rfqId, companyId } },
    });
    if (!match) throw new NotFoundException('Match not found');

    return this.prisma.rfqVendorMatch.update({
      where: { id: match.id },
      data: { status: 'DECLINED', declinedAt: new Date(), declineReason: reason },
    });
  }

  async getRfqStats(companyId: string) {
    const [total, matched, quoted, declined] = await Promise.all([
      this.prisma.rfqVendorMatch.count({ where: { companyId } }),
      this.prisma.rfqVendorMatch.count({ where: { companyId, status: 'SENT' } }),
      this.prisma.rfqVendorMatch.count({ where: { companyId, status: 'QUOTED' } }),
      this.prisma.rfqVendorMatch.count({ where: { companyId, status: 'DECLINED' } }),
    ]);
    return { total, matched, quoted, declined };
  }
}
