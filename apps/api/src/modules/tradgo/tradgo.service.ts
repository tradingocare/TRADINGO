import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class TradgoService {
  private readonly logger = new Logger(TradgoService.name);

  constructor(private readonly prisma: PrismaService) {}

  async getCompanyForUser(userId: string) {
    const owner = await this.prisma.companyOwner.findFirst({
      where: { userId },
      select: { companyId: true },
    });
    if (!owner) return null;
    return this.prisma.company.findUnique({
      where: { id: owner.companyId },
      select: { id: true, verificationLevel: true, totalProducts: true, trustScore: true, createdAt: true },
    });
  }

  async getRaces() {
    const totalCompanies = await this.prisma.company.count({ where: { deletedAt: null } });
    return [
      { id: 'race-q1-2026', name: 'Q1 2026 Trading Sprint', startDate: '2026-01-01T00:00:00Z', endDate: '2026-03-31T23:59:59Z', status: 'completed' as const, participants: Math.floor(totalCompanies * 0.4), prize: '₹50,000 GoCash + Elite Badge' },
      { id: 'race-q2-2026', name: 'Q2 2026 Growth Challenge', startDate: '2026-04-01T00:00:00Z', endDate: '2026-06-30T23:59:59Z', status: 'active' as const, participants: Math.floor(totalCompanies * 0.55), prize: '₹75,000 GoCash + TRADGO Trophy' },
      { id: 'race-q3-2026', name: 'Q3 2026 Monsoon Trade Drive', startDate: '2026-07-01T00:00:00Z', endDate: '2026-09-30T23:59:59Z', status: 'upcoming' as const, participants: 0, prize: '₹1,00,000 GoCash + Premium Listing' },
    ];
  }

  async getBadges(companyId?: string) {
    if (!companyId) return [];
    const company = await this.prisma.company.findUnique({
      where: { id: companyId },
      select: { verificationLevel: true, totalProducts: true, trustScore: true, createdAt: true },
    });
    if (!company) return [];

    const badges: { id: string; name: string; description: string; icon: string; earnedAt: string }[] = [];

    if (company.verificationLevel !== 'LEVEL_0') {
      badges.push({ id: 'verified', name: 'Verified Seller', description: 'Identity and business verified', icon: 'ShieldCheck', earnedAt: new Date().toISOString() });
    }
    if (company.verificationLevel === 'LEVEL_2' || company.verificationLevel === 'LEVEL_3') {
      badges.push({ id: 'trusted', name: 'Trusted Partner', description: 'Achieved Level 2+ verification', icon: 'Crown', earnedAt: new Date().toISOString() });
    }
    if ((company.totalProducts ?? 0) >= 10) {
      badges.push({ id: 'catalog-builder', name: 'Catalog Builder', description: 'Listed 10+ products', icon: 'Package', earnedAt: new Date().toISOString() });
    }
    if ((company.totalProducts ?? 0) >= 50) {
      badges.push({ id: 'bulk-supplier', name: 'Bulk Supplier', description: 'Listed 50+ products', icon: 'Layers', earnedAt: new Date().toISOString() });
    }
    if ((company.trustScore ?? 0) >= 80) {
      badges.push({ id: 'high-trust', name: 'High Trust', description: 'Trust score of 80+', icon: 'Star', earnedAt: new Date().toISOString() });
    }
    if (company.createdAt && new Date(company.createdAt) < new Date(Date.now() - 365 * 24 * 60 * 60 * 1000)) {
      badges.push({ id: 'veteran', name: 'TRADINGO Veteran', description: 'Active for over 1 year', icon: 'Flame', earnedAt: new Date().toISOString() });
    }

    return badges;
  }

  async getLeaderboard(limit = 20) {
    const companies = await this.prisma.company.findMany({
      where: { deletedAt: null, status: 'ACTIVE' },
      orderBy: [{ trustScore: 'desc' }, { totalProducts: 'desc' }],
      take: limit,
      select: { id: true, name: true, slug: true, logo: true, trustScore: true, totalProducts: true, verificationLevel: true },
    });

    return companies.map((c, i) => ({
      rank: i + 1,
      companyId: c.id,
      companyName: c.name,
      slug: c.slug,
      logo: c.logo,
      trustScore: c.trustScore,
      totalProducts: c.totalProducts,
      verificationLevel: c.verificationLevel,
      score: Math.round((c.trustScore ?? 0) * 0.6 + Math.min((c.totalProducts ?? 0) * 2, 40)),
    }));
  }
}
