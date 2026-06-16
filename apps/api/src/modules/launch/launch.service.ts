import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { Prisma, ChecklistStatus, IncidentStatus, IncidentSeverity } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateIncidentDto } from './dto/create-incident.dto';
import { UpdateIncidentStatusDto } from './dto/update-incident-status.dto';
import { AddIncidentUpdateDto } from './dto/add-incident-update.dto';

@Injectable()
export class LaunchService {
  private readonly logger = new Logger(LaunchService.name);

  constructor(private readonly prisma: PrismaService) {}

  async getLaunchDashboard() {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const [
      totalCompanies,
      companiesOnboarded,
      totalProducts,
      activeUsers,
      searchVolume,
      pageViews,
      userSignups,
      checklistProgress,
      activeIncidents,
      recentIncidents,
    ] = await Promise.all([
      this.prisma.company.count({ where: { deletedAt: null } }),
      this.prisma.betaCompanyProfile.count({
        where: { onboardingCompletedAt: { not: null } },
      }),
      this.prisma.product.count({ where: { deletedAt: null } }),
      this.prisma.user.count({ where: { isActive: true } }),
      this.prisma.usageEvent.count({
        where: { eventName: 'search', timestamp: { gte: thirtyDaysAgo } },
      }),
      this.prisma.usageEvent.count({
        where: { eventName: 'page_view', timestamp: { gte: thirtyDaysAgo } },
      }),
      this.prisma.user.count(),
      this.getChecklistProgress(),
      this.prisma.incident.count({
        where: { status: { not: IncidentStatus.RESOLVED } },
      }),
      this.prisma.incident.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: { updates: { orderBy: { createdAt: 'desc' }, take: 1 } },
      }),
    ]);

    const conversionRate = userSignups > 0
      ? Number(((totalCompanies / userSignups) * 100).toFixed(2))
      : 0;

    return {
      totalCompanies,
      companiesOnboarded,
      totalProducts,
      activeUsers,
      searchVolume,
      pageViews,
      conversionRate,
      checklistProgress,
      activeIncidents,
      recentIncidents,
    };
  }

  async getCompanyMetrics() {
    const [
      totalCompanies,
      companiesByStatus,
      avgTrustScore,
      companiesByVerificationLevel,
      companiesPerOnboardingStep,
      avgTimeToOnboard,
      companiesBySubscriptionPlan,
    ] = await Promise.all([
      this.prisma.company.count({ where: { deletedAt: null } }),
      this.prisma.company.groupBy({
        by: ['status'],
        where: { deletedAt: null },
        _count: { id: true },
      }),
      this.prisma.company.aggregate({
        where: { deletedAt: null },
        _avg: { trustScore: true },
      }),
      this.prisma.company.groupBy({
        by: ['verificationLevel'],
        where: { deletedAt: null },
        _count: { id: true },
      }),
      this.prisma.betaCompanyProfile.groupBy({
        by: ['onboardingStep'],
        _count: { id: true },
      }),
      this.getAvgTimeToOnboardRaw(),
      this.prisma.company.groupBy({
        by: ['subscriptionPlan'],
        where: { deletedAt: null, subscriptionPlan: { not: null } },
        _count: { id: true },
      }),
    ]);

    const avgTimeToOnboardFormatted = avgTimeToOnboard
      ? `${Math.round(avgTimeToOnboard)} days`
      : null;

    return {
      totalCompanies,
      byStatus: companiesByStatus.map((s) => ({
        status: s.status,
        count: s._count.id,
      })),
      avgTrustScore: avgTrustScore._avg.trustScore ?? 0,
      byVerificationLevel: companiesByVerificationLevel.map((v) => ({
        level: v.verificationLevel,
        count: v._count.id,
      })),
      perOnboardingStep: companiesPerOnboardingStep.map((s) => ({
        step: s.onboardingStep,
        count: s._count.id,
      })),
      avgTimeToOnboard: avgTimeToOnboardFormatted,
      bySubscriptionPlan: companiesBySubscriptionPlan.map((p) => ({
        plan: p.subscriptionPlan,
        count: p._count.id,
      })),
    };
  }

  private async getAvgTimeToOnboardRaw(): Promise<number | null> {
    const profiles = await this.prisma.betaCompanyProfile.findMany({
      where: { onboardingCompletedAt: { not: null } },
      select: { createdAt: true, onboardingCompletedAt: true },
    });
    if (profiles.length === 0) return null;
    const totalDays = profiles.reduce((sum, p) => {
      const diff = p.onboardingCompletedAt!.getTime() - p.createdAt.getTime();
      return sum + diff / (1000 * 60 * 60 * 24);
    }, 0);
    return totalDays / profiles.length;
  }

  async getProductMetrics() {
    const [
      totalProducts,
      productsByStatus,
      productsByCategory,
      productsByType,
      productsWithImages,
      totalVariants,
      totalInventories,
      productsImported,
    ] = await Promise.all([
      this.prisma.product.count({ where: { deletedAt: null } }),
      this.prisma.product.groupBy({
        by: ['status'],
        where: { deletedAt: null },
        _count: { id: true },
      }),
      this.prisma.product.groupBy({
        by: ['categoryId'],
        where: { deletedAt: null, categoryId: { not: null } },
        _count: { id: true },
      }),
      this.prisma.product.groupBy({
        by: ['productType'],
        where: { deletedAt: null },
        _count: { id: true },
      }),
      this.prisma.product.count({
        where: { deletedAt: null, media: { some: {} } },
      }),
      this.prisma.productVariant.count(),
      this.prisma.productInventory.count(),
      this.prisma.importJob.count({
        where: { type: 'PRODUCT_MASTER', status: 'COMPLETED' },
      }),
    ]);

    const totalWithoutImages = totalProducts - productsWithImages;
    const avgPriceData = await this.prisma.productVariant.aggregate({
      _avg: { price: true },
    });

    return {
      totalProducts,
      byStatus: productsByStatus.map((s) => ({
        status: s.status,
        count: s._count.id,
      })),
      byCategory: productsByCategory.map((c) => ({
        categoryId: c.categoryId,
        count: c._count.id,
      })),
      byType: productsByType.map((t) => ({
        type: t.productType,
        count: t._count.id,
      })),
      avgPrice: avgPriceData._avg.price ? Number(avgPriceData._avg.price.toFixed(2)) : null,
      withImages: productsWithImages,
      withoutImages: totalWithoutImages,
      totalVariants,
      totalInventories,
      importsCompleted: productsImported,
    };
  }

  async getSearchMetrics() {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const [
      totalSearches,
      topQueries,
      zeroResultSearches,
      searchesByCategory,
      dailyTrend,
    ] = await Promise.all([
      this.prisma.usageEvent.count({
        where: { eventName: 'search' },
      }),
      this.getTopSearchQueries(),
      this.prisma.usageEvent.count({
        where: { eventName: 'search', properties: { path: ['resultsCount'], equals: 0 } },
      }),
      this.prisma.usageEvent.groupBy({
        by: ['category'],
        where: { eventName: 'search', category: { not: null } },
        _count: { id: true },
      }),
      this.getDailyEventTrend('search', thirtyDaysAgo),
    ]);

    const uniqueSearchers = await this.prisma.usageEvent.groupBy({
      by: ['companyId'],
      where: { eventName: 'search' },
      _count: { id: true },
    });

    return {
      totalSearches,
      uniqueSearchers: uniqueSearchers.length,
      topQueries,
      zeroResultSearches,
      byCategory: searchesByCategory.map((c) => ({
        category: c.category,
        count: c._count.id,
      })),
      dailyTrend,
    };
  }

  async getTrafficMetrics() {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const [
      totalPageViews,
      pageViewsByPage,
      trafficByCategory,
      dailyTrend,
    ] = await Promise.all([
      this.prisma.usageEvent.count({
        where: { eventName: 'page_view' },
      }),
      this.prisma.usageEvent.groupBy({
        by: ['category'],
        where: { eventName: 'page_view', category: { not: null } },
        _count: { id: true },
      }),
      this.prisma.usageEvent.groupBy({
        by: ['category'],
        where: { eventName: 'page_view', category: { not: null } },
        _count: { id: true },
      }),
      this.getDailyEventTrend('page_view', thirtyDaysAgo),
    ]);

    const uniqueVisitors = await this.prisma.usageEvent.groupBy({
      by: ['companyId'],
      where: { eventName: 'page_view' },
      _count: { id: true },
    });

    return {
      totalPageViews,
      uniqueVisitors: uniqueVisitors.length,
      byPage: pageViewsByPage.map((p) => ({
        page: p.category,
        views: p._count.id,
      })),
      byCategory: trafficByCategory.map((c) => ({
        category: c.category,
        views: c._count.id,
      })),
      dailyTrend,
    };
  }

  async getConversionMetrics() {
    const signups = await this.prisma.user.count();
    const companiesCreated = await this.prisma.company.count({ where: { deletedAt: null } });

    const firstOrderCompanies = await this.prisma.order.groupBy({
      by: ['buyerCompanyId'],
      _count: { id: true },
    });

    const repeatOrderCompanies = await this.prisma.order.groupBy({
      by: ['buyerCompanyId'],
      _count: { id: true },
      having: { id: { _count: { gte: 2 } } },
    });

    const companiesWithProducts = await this.prisma.product.groupBy({
      by: ['companyId'],
      where: { deletedAt: null },
      _count: { id: true },
    });

    const firstOrder = firstOrderCompanies.length;
    const repeatOrders = repeatOrderCompanies.length;
    const withProducts = companiesWithProducts.length;

    return {
      steps: {
        signups,
        companiesCreated,
        productsAdded: withProducts,
        firstOrder,
        repeatOrders,
      },
      rates: {
        signupToCompany: signups > 0 ? Number(((companiesCreated / signups) * 100).toFixed(2)) : 0,
        companyToProduct: companiesCreated > 0 ? Number(((withProducts / companiesCreated) * 100).toFixed(2)) : 0,
        productToFirstOrder: withProducts > 0 ? Number(((firstOrder / withProducts) * 100).toFixed(2)) : 0,
        firstOrderToRepeat: firstOrder > 0 ? Number(((repeatOrders / firstOrder) * 100).toFixed(2)) : 0,
      },
    };
  }

  async getChecklistItems() {
    return this.prisma.launchChecklistItem.findMany({
      orderBy: { sortOrder: 'asc' },
    });
  }

  async getChecklistStatuses(companyId?: string) {
    const where: Prisma.LaunchChecklistStatusWhereInput = {};
    if (companyId) where.companyId = companyId;
    return this.prisma.launchChecklistStatus.findMany({
      where,
      include: { item: true },
      orderBy: { item: { sortOrder: 'asc' } },
    });
  }

  async updateChecklistStatus(itemId: string, status: ChecklistStatus, userId: string, notes?: string) {
    const item = await this.prisma.launchChecklistItem.findUnique({
      where: { id: itemId },
    });
    if (!item) throw new NotFoundException('Checklist item not found');

    return this.prisma.launchChecklistStatus.upsert({
      where: { itemId_companyId: { itemId, companyId: '' } },
      create: {
        itemId,
        companyId: '',
        status,
        completedBy: status === ChecklistStatus.COMPLETED || status === ChecklistStatus.VERIFIED ? userId : null,
        completedAt: status === ChecklistStatus.COMPLETED || status === ChecklistStatus.VERIFIED ? new Date() : null,
        notes,
      },
      update: {
        status,
        completedBy: status === ChecklistStatus.COMPLETED || status === ChecklistStatus.VERIFIED ? userId : null,
        completedAt: status === ChecklistStatus.COMPLETED || status === ChecklistStatus.VERIFIED ? new Date() : null,
        notes: notes ?? undefined,
      },
      include: { item: true },
    });
  }

  async verifyChecklistItem(itemId: string, userId: string) {
    const item = await this.prisma.launchChecklistItem.findUnique({
      where: { id: itemId },
    });
    if (!item) throw new NotFoundException('Checklist item not found');

    return this.prisma.launchChecklistStatus.upsert({
      where: { itemId_companyId: { itemId, companyId: '' } },
      create: {
        itemId,
        companyId: '',
        status: ChecklistStatus.VERIFIED,
        completedBy: userId,
        completedAt: new Date(),
      },
      update: {
        status: ChecklistStatus.VERIFIED,
        completedBy: userId,
        completedAt: new Date(),
      },
      include: { item: true },
    });
  }

  async getChecklistProgress() {
    const statuses = await this.prisma.launchChecklistStatus.groupBy({
      by: ['status'],
      _count: { id: true },
    });

    const total = await this.prisma.launchChecklistItem.count();

    const summary: Record<string, number> = {};
    for (const s of statuses) {
      summary[s.status] = s._count.id;
    }

    return {
      total,
      byStatus: statuses.map((s) => ({
        status: s.status,
        count: s._count.id,
      })),
      summary,
    };
  }

  async createIncident(dto: CreateIncidentDto, userId: string) {
    const { title, description, severity, impactedServices, reportedBy } = dto;
    const incident = await this.prisma.incident.create({
      data: {
        title,
        description,
        severity: severity as IncidentSeverity,
        impactedServices: impactedServices ?? [],
        reportedBy: reportedBy ?? userId,
        updates: {
          create: {
            message: `Incident reported: ${title}`,
            status: IncidentStatus.DETECTED,
          },
        },
      },
      include: { updates: { orderBy: { createdAt: 'desc' } } },
    });

    this.logger.log(`Incident ${incident.id} created by ${userId}`);
    return incident;
  }

  async getIncidents(filters?: { page?: number; limit?: number; status?: IncidentStatus; severity?: IncidentSeverity }) {
    const page = filters?.page ?? 1;
    const limit = filters?.limit ?? 20;
    const where: Prisma.IncidentWhereInput = {};

    if (filters?.status) where.status = filters.status;
    if (filters?.severity) where.severity = filters.severity;

    const [data, total] = await Promise.all([
      this.prisma.incident.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          updates: { orderBy: { createdAt: 'desc' }, take: 1 },
        },
      }),
      this.prisma.incident.count({ where }),
    ]);

    return {
      data,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async getIncident(id: string) {
    const incident = await this.prisma.incident.findUnique({
      where: { id },
      include: {
        updates: { orderBy: { createdAt: 'desc' } },
      },
    });
    if (!incident) throw new NotFoundException('Incident not found');
    return incident;
  }

  async updateIncidentStatus(id: string, dto: UpdateIncidentStatusDto, userId: string) {
    const incident = await this.prisma.incident.findUnique({ where: { id } });
    if (!incident) throw new NotFoundException('Incident not found');

    const resolvedAt = dto.status === IncidentStatus.RESOLVED ? new Date() : null;

    await this.prisma.$transaction([
      this.prisma.incident.update({
        where: { id },
        data: {
          status: dto.status,
          resolvedAt,
        },
      }),
      this.prisma.incidentUpdate.create({
        data: {
          incidentId: id,
          message: dto.message,
          status: dto.status,
        },
      }),
    ]);

    this.logger.log(`Incident ${id} status updated to ${dto.status} by ${userId}`);
    return this.getIncident(id);
  }

  async addIncidentUpdate(id: string, dto: AddIncidentUpdateDto, userId: string) {
    const incident = await this.prisma.incident.findUnique({ where: { id } });
    if (!incident) throw new NotFoundException('Incident not found');

    const update = await this.prisma.incidentUpdate.create({
      data: {
        incidentId: id,
        message: dto.message,
        status: dto.status,
      },
    });

    this.logger.log(`Update added to incident ${id} by ${userId}`);
    return update;
  }

  async getActiveIncidents() {
    return this.prisma.incident.findMany({
      where: { status: { not: IncidentStatus.RESOLVED } },
      orderBy: { createdAt: 'desc' },
      include: { updates: { orderBy: { createdAt: 'desc' }, take: 1 } },
    });
  }

  private async getTopSearchQueries() {
    const events = await this.prisma.usageEvent.findMany({
      where: { eventName: 'search' },
      select: { properties: true },
      take: 1000,
      orderBy: { timestamp: 'desc' },
    });

    const queryCounts = new Map<string, number>();
    for (const event of events) {
      if (event.properties && typeof event.properties === 'object') {
        const query = (event.properties as Record<string, unknown>)['query'];
        if (query && typeof query === 'string') {
          queryCounts.set(query, (queryCounts.get(query) ?? 0) + 1);
        }
      }
    }

    return Array.from(queryCounts.entries())
      .map(([query, count]) => ({ query, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 20);
  }

  private async getDailyEventTrend(eventName: string, since: Date) {
    const events = await this.prisma.usageEvent.findMany({
      where: { eventName, timestamp: { gte: since } },
      select: { timestamp: true },
    });

    const dailyCounts = new Map<string, number>();
    for (const event of events) {
      const day = event.timestamp.toISOString().slice(0, 10);
      dailyCounts.set(day, (dailyCounts.get(day) ?? 0) + 1);
    }

    return Array.from(dailyCounts.entries())
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }
}
