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

  // ─── UNIFIED BADGE REGISTRY ─────────────────────────────────

  async getUnifiedBadges(companyId: string) {
    const company = await this.prisma.company.findUnique({
      where: { id: companyId },
      select: { verificationLevel: true, totalProducts: true, trustScore: true, createdAt: true, status: true },
    });
    if (!company) return [];

    const badges: { badge: string; earned: boolean; label: string; description: string }[] = [];

    const vl = company.verificationLevel;
    badges.push({ badge: 'verified', earned: vl !== 'LEVEL_0', label: 'Verified', description: 'Identity and business verified' });
    badges.push({ badge: 'trusted', earned: vl === 'LEVEL_2' || vl === 'LEVEL_3', label: 'Trusted', description: 'Level 2+ verification achieved' });
    badges.push({ badge: 'premium', earned: vl === 'LEVEL_4' || vl === 'LEVEL_5', label: 'Premium', description: 'Level 4+ verification achieved' });
    badges.push({ badge: 'gold', earned: (company.trustScore ?? 0) >= 90, label: 'Gold', description: 'Trust score of 90+' });
    badges.push({ badge: 'platinum', earned: (company.trustScore ?? 0) >= 95 && (vl === 'LEVEL_5' || vl === 'LEVEL_6'), label: 'Platinum', description: 'Trust score 95+ and Level 5+ verification' });
    badges.push({ badge: 'elite', earned: vl === 'LEVEL_6', label: 'Elite', description: 'Level 6 verification achieved' });
    badges.push({ badge: 'top-seller', earned: (company.totalProducts ?? 0) >= 100, label: 'Top Seller', description: 'Listed 100+ products' });
    badges.push({ badge: 'fast-responder', earned: (company.totalProducts ?? 0) >= 10 && (company.trustScore ?? 0) >= 60, label: 'Fast Responder', description: '10+ products and 60+ trust score' });
    badges.push({ badge: 'reliable-supplier', earned: (company.trustScore ?? 0) >= 70 && vl !== 'LEVEL_0', label: 'Reliable Supplier', description: 'Trust score 70+ and verified' });
    badges.push({ badge: 'future', earned: false, label: 'Future', description: 'Coming soon' });

    return badges;
  }

  // ─── TRUST SIGNALS ──────────────────────────────────────────

  async getTrustSignals(companyId: string) {
    const [company, orderCounts, shipmentCounts, quoteCounts, rfqCounts, wallet] = await Promise.all([
      this.prisma.company.findUnique({
        where: { id: companyId },
        select: { trustScore: true, verificationLevel: true, status: true, totalProducts: true, responseRate: true, createdAt: true },
      }),
      this.prisma.order.aggregate({
        where: { OR: [{ buyerCompanyId: companyId }, { sellerCompanyId: companyId }], deletedAt: null },
        _count: true,
      }),
      this.prisma.shipment.aggregate({
        where: { OR: [{ buyerCompanyId: companyId }, { sellerCompanyId: companyId }], deletedAt: null },
        _count: true,
      }),
      this.prisma.quote.aggregate({
        where: { OR: [{ companyId }, { rfq: { companyId } }] },
        _count: true,
      }),
      this.prisma.rfq.aggregate({
        where: { companyId, deletedAt: null },
        _count: true,
      }),
      this.prisma.gOCASH_Wallet.findFirst({
        where: { companyId },
        select: { currentBalance: true, lifetimeEarned: true, status: true },
      }),
    ]);

    if (!company) return null;

    return {
      trustScore: company.trustScore,
      verificationLevel: company.verificationLevel,
      companyStatus: company.status,
      totalProducts: company.totalProducts,
      responseRate: company.responseRate,
      memberSince: company.createdAt,
      totalOrders: orderCounts._count,
      totalShipments: shipmentCounts._count,
      totalQuotes: quoteCounts._count,
      totalRfqs: rfqCounts._count,
      goCashBalance: wallet ? Number(wallet.currentBalance) : 0,
      goCashLifetimeEarned: wallet ? Number(wallet.lifetimeEarned) : 0,
      walletStatus: wallet?.status ?? null,
    };
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

  // ─── UNIFIED RANKING FACADE ───────────────────────────────

  async getUnifiedRanking(companyId: string) {
    const [leaderboard, trustSignals] = await Promise.all([
      this.getLeaderboard(100),
      this.getTrustSignals(companyId),
    ]);

    const leaderboardEntry = leaderboard.find(e => e.companyId === companyId);
    const rank = leaderboardEntry?.rank ?? null;
    const totalEntries = leaderboard.length;

    const badges = await this.getUnifiedBadges(companyId);

    return {
      companyId,
      rank,
      totalEntries,
      percentile: rank && totalEntries > 0
        ? Math.round((1 - rank / totalEntries) * 100)
        : null,
      trustScore: trustSignals?.trustScore ?? null,
      verificationLevel: trustSignals?.verificationLevel ?? null,
      totalProducts: trustSignals?.totalProducts ?? 0,
      totalOrders: trustSignals?.totalOrders ?? 0,
      badges: badges.filter(b => b.earned).map(b => b.badge),
    };
  }

  async getCityRankings(city: string, limit = 10) {
    const [companies, products] = await Promise.all([
      this.prisma.company.findMany({
        where: {
          deletedAt: null,
          status: 'ACTIVE',
          locations: { some: { city: { equals: city, mode: 'insensitive' }, deletedAt: null } },
        },
        orderBy: { trustScore: 'desc' },
        take: limit,
        select: { id: true, name: true, slug: true, logo: true, trustScore: true, totalProducts: true, verificationLevel: true },
      }),
      this.prisma.product.findMany({
        where: {
          status: 'ACTIVE',
          company: {
            deletedAt: null,
            locations: { some: { city: { equals: city, mode: 'insensitive' }, deletedAt: null } },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        select: { id: true, name: true, slug: true, originalPrice: true, media: { where: { type: 'IMAGE' }, take: 1, select: { url: true } }, company: { select: { name: true, slug: true, trustScore: true } } },
      }),
    ]);

    return {
      city,
      companyCount: await this.prisma.company.count({
        where: {
          deletedAt: null,
          locations: { some: { city: { equals: city, mode: 'insensitive' }, deletedAt: null } },
        },
      }),
      productCount: await this.prisma.product.count({
        where: {
          status: 'ACTIVE',
          company: {
            deletedAt: null,
            locations: { some: { city: { equals: city, mode: 'insensitive' }, deletedAt: null } },
          },
        },
      }),
      topCompanies: companies.map((c, i) => ({
        rank: i + 1,
        id: c.id,
        name: c.name,
        slug: c.slug,
        logo: c.logo,
        trustScore: c.trustScore,
        totalProducts: c.totalProducts,
        verificationLevel: c.verificationLevel,
      })),
      topProducts: products.map((p) => ({
        id: p.id,
        name: p.name,
        slug: p.slug,
        price: p.originalPrice ? Number(p.originalPrice) : null,
        image: p.media?.[0]?.url ?? null,
        companyName: p.company.name,
        companySlug: p.company.slug,
        trustScore: p.company.trustScore,
      })),
    };
  }

  async getStateRankings(state: string, limit = 10) {
    const [companies, products] = await Promise.all([
      this.prisma.company.findMany({
        where: {
          deletedAt: null,
          status: 'ACTIVE',
          locations: { some: { state: { equals: state, mode: 'insensitive' }, deletedAt: null } },
        },
        orderBy: { trustScore: 'desc' },
        take: limit,
        select: { id: true, name: true, slug: true, logo: true, trustScore: true, totalProducts: true, verificationLevel: true },
      }),
      this.prisma.product.findMany({
        where: {
          status: 'ACTIVE',
          company: {
            deletedAt: null,
            locations: { some: { state: { equals: state, mode: 'insensitive' }, deletedAt: null } },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        select: { id: true, name: true, slug: true, originalPrice: true, media: { where: { type: 'IMAGE' }, take: 1, select: { url: true } }, company: { select: { name: true, slug: true, trustScore: true } } },
      }),
    ]);

    return {
      state,
      companyCount: companies.length,
      productCount: products.length,
      topCompanies: companies.map((c, i) => ({
        rank: i + 1,
        id: c.id,
        name: c.name,
        slug: c.slug,
        logo: c.logo,
        trustScore: c.trustScore,
        totalProducts: c.totalProducts,
        verificationLevel: c.verificationLevel,
      })),
      topProducts: products.map((p) => ({
        id: p.id,
        name: p.name,
        slug: p.slug,
        price: p.originalPrice ? Number(p.originalPrice) : null,
        image: p.media?.[0]?.url ?? null,
        companyName: p.company.name,
        companySlug: p.company.slug,
        trustScore: p.company.trustScore,
      })),
    };
  }

  async getCategoryRankings(categoryId: string, limit = 10) {
    const products = await this.prisma.product.findMany({
      where: {
        status: 'ACTIVE',
        categoryId,
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      select: { id: true, name: true, slug: true, originalPrice: true, media: { where: { type: 'IMAGE' }, take: 1, select: { url: true } }, company: { select: { id: true, name: true, slug: true, trustScore: true, verificationLevel: true } } },
    });

    const companyIds = [...new Set(products.map(p => p.company.id))];
    const companies = await this.prisma.company.findMany({
      where: { id: { in: companyIds }, deletedAt: null },
      select: { id: true, name: true, slug: true, logo: true, trustScore: true, totalProducts: true, verificationLevel: true },
    });

    const category = await this.prisma.category.findUnique({
      where: { id: categoryId },
      select: { id: true, name: true },
    });

    return {
      category: category ?? { id: categoryId, name: categoryId },
      totalProducts: await this.prisma.product.count({ where: { status: 'ACTIVE', categoryId } }),
      topProducts: products.map((p) => ({
        id: p.id,
        name: p.name,
        slug: p.slug,
        price: p.originalPrice ? Number(p.originalPrice) : null,
        image: p.media?.[0]?.url ?? null,
        companyName: p.company.name,
        companySlug: p.company.slug,
        trustScore: p.company.trustScore,
      })),
      topCompanies: companies
        .sort((a, b) => (b.trustScore ?? 0) - (a.trustScore ?? 0))
        .slice(0, limit)
        .map((c, i) => ({
          rank: i + 1,
          id: c.id,
          name: c.name,
          slug: c.slug,
          logo: c.logo,
          trustScore: c.trustScore,
          totalProducts: c.totalProducts,
          verificationLevel: c.verificationLevel,
        })),
    };
  }
}
