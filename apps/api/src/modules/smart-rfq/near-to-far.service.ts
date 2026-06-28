import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class NearToFarService {
  private readonly logger = new Logger(NearToFarService.name);
  constructor(private readonly prisma: PrismaService) {}

  async findSuppliers(rfqId: string) {
    const rfq = await this.prisma.rfq.findUnique({
      where: { id: rfqId },
      include: { locations: true, productItems: true },
    });
    if (!rfq) return [];

    const primaryLocation = rfq.locations?.find((l) => l.isPrimary) || rfq.locations?.[0];
    const buyerCompany = await this.prisma.company.findUnique({ where: { id: rfq.companyId }, include: { locations: true } });
    const buyerLocation = buyerCompany?.locations?.[0];

    const sellers = await this.prisma.company.findMany({
      where: {
        id: { not: rfq.companyId },
        status: 'ACTIVE',
        subscriptionStatus: { not: 'EXPIRED' },
        verificationLevel: { not: 'LEVEL_0' },
      },
      select: {
        id: true, name: true, slug: true, logo: true,
        trustScore: true, verificationLevel: true, responseRate: true,
        locations: { take: 1 },
      },
      take: 50,
    });

    const scored = sellers.map((seller) => {
      const sellerLocation = seller.locations?.[0];
      let geoScore = 50;
      if (buyerLocation && sellerLocation) {
        if (buyerLocation.city === sellerLocation.city) geoScore = 100;
        else if (buyerLocation.state === sellerLocation.state) geoScore = 80;
        else geoScore = 40;
      }

      const trustScore = seller.trustScore ?? 0;
      const verificationScore = seller.verificationLevel === 'LEVEL_6' ? 100 : seller.verificationLevel === 'LEVEL_5' ? 90 : seller.verificationLevel === 'LEVEL_4' ? 80 : seller.verificationLevel === 'LEVEL_3' ? 70 : seller.verificationLevel === 'LEVEL_2' ? 60 : 50;
      const responseScore = Math.round((seller.responseRate ?? 0) * 100);
      const planScore = 80;

      const totalScore = Math.round(geoScore * 0.3 + trustScore * 0.2 + verificationScore * 0.15 + responseScore * 0.2 + planScore * 0.15);

      return {
        companyId: seller.id,
        companyName: seller.name,
        slug: seller.slug,
        logo: seller.logo,
        city: sellerLocation?.city ?? null,
        state: sellerLocation?.state ?? null,
        trustScore: seller.trustScore,
        verificationLevel: seller.verificationLevel,
        responseRate: seller.responseRate,
        matchScore: totalScore,
        geoScore,
        trustScoreFactor: trustScore,
        verificationScore,
        responseScore,
        planScore,
      };
    });

    return scored.sort((a, b) => b.matchScore - a.matchScore);
  }

  async getMatchingStats() {
    const [totalSellers, verifiedSellers, activeSellers] = await Promise.all([
      this.prisma.company.count({ where: { status: 'ACTIVE' } }),
      this.prisma.company.count({ where: { verificationLevel: { not: 'LEVEL_0' }, status: 'ACTIVE' } }),
      this.prisma.company.count({ where: { subscriptionStatus: { not: 'EXPIRED' }, status: 'ACTIVE' } }),
    ]);
    return { totalSellers, verifiedSellers, activeSellers };
  }
}
