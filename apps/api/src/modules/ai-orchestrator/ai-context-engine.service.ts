import { Injectable, Logger } from '@nestjs/common'
import { PrismaService } from '../../prisma/prisma.service'
import { ContextRequestDto } from './dto/ai-orchestrator.dto'

@Injectable()
export class AiContextEngine {
  private readonly logger = new Logger(AiContextEngine.name)

  constructor(private readonly prisma: PrismaService) {}

  async getAggregatedContext(dto: ContextRequestDto): Promise<Record<string, unknown>> {
    const context: Record<string, unknown> = {}
    const fetches: Promise<void>[] = []

    if (dto.include.includes('company')) {
      fetches.push(
        this.getCompanyContext(dto.companyId).then(c => { context.company = c }).catch(e => { this.logger.warn(`Company context failed: ${e.message}`); context.company = {} })
      )
    }
    if (dto.productId && dto.include.includes('product')) {
      fetches.push(
        this.getProductContext(dto.productId).then(p => { context.product = p }).catch(e => { this.logger.warn(`Product context failed: ${e.message}`); context.product = {} })
      )
    }
    if (dto.include.includes('user') && dto.userId) {
      fetches.push(
        this.getUserContext(dto.userId).then(u => { context.user = u }).catch(e => { this.logger.warn(`User context failed: ${e.message}`); context.user = {} })
      )
    }
    if (dto.include.includes('marketplace')) {
      fetches.push(
        this.getMarketplaceContext().then(m => { context.marketplace = m }).catch(e => { this.logger.warn(`Marketplace context failed: ${e.message}`); context.marketplace = {} })
      )
    }
    if (dto.include.includes('membership')) {
      fetches.push(
        this.getMembershipContext(dto.companyId).then(m => { context.membership = m }).catch(e => { this.logger.warn(`Membership context failed: ${e.message}`); context.membership = {} })
      )
    }

    await Promise.all(fetches)
    return context
  }

  private async getCompanyContext(companyId: string): Promise<Record<string, unknown>> {
    const company = await this.prisma.company.findUnique({
      where: { id: companyId },
      select: {
        id: true, name: true, slug: true, logo: true, verificationLevel: true,
        businessType: true, establishedYear: true, employeeCount: true,
        description: true, website: true, trustScore: true, status: true,
        subscriptionPlan: true, subscriptionStatus: true,
      },
    })
    if (!company) return {}

    const [productCount, activeProductCount, avgScore] = await Promise.all([
      this.prisma.product.count({ where: { companyId, deletedAt: null } }),
      this.prisma.product.count({ where: { companyId, status: 'ACTIVE' as any, deletedAt: null } }),
      this.prisma.catalogQualityScore.aggregate({
        where: { product: { companyId, deletedAt: null } },
        _avg: { total: true },
      }),
    ])

    const industries = await this.prisma.companyIndustry.findMany({
      where: { companyId },
      include: { industry: { select: { id: true, name: true } } },
    })

    return {
      ...company,
      productCount,
      activeProductCount,
      avgQualityScore: Math.round(avgScore._avg.total ?? 0),
      industries: industries.map(i => i.industry),
    }
  }

  private async getProductContext(productId: string): Promise<Record<string, unknown>> {
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
      select: {
        id: true, name: true, slug: true, brand: true, status: true,
        categoryId: true, companyId: true, originalPrice: true,
        shortDescription: true, focusKeywords: true,
        category: { select: { id: true, name: true } },
        media: { select: { id: true, url: true, isPrimary: true }, take: 5 },
        specifications: { take: 10 },
        attributes: { take: 10 },
        inventory: { select: { availableQuantity: true, stockStatus: true } },
        qualityScores: { select: { total: true, completeness: true, titleQuality: true, descriptionQuality: true, imageQuality: true, specificationQuality: true, seoQuality: true } },
      },
    })
    if (!product) return {}

    const [rfqCount, orderCount] = await Promise.all([
      this.prisma.rfq.count({ where: { categoryId: product.categoryId ?? undefined, deletedAt: null } }),
      this.prisma.order.count({ where: { items: { some: { productId } } } }),
    ])

    return { ...product, rfqCount, orderCount, mediaCount: product.media.length, specCount: product.specifications.length, attrCount: product.attributes.length }
  }

  private async getUserContext(userId: string): Promise<Record<string, unknown>> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, email: true, role: true, verificationLevel: true, isActive: true },
    })
    return user ?? {}
  }

  private async getMarketplaceContext(): Promise<Record<string, unknown>> {
    const [companyCount, buyerCount, sellerCount, productCount, categoryCount] = await Promise.all([
      this.prisma.company.count({ where: { status: 'ACTIVE' as any } }),
      this.prisma.company.count({ where: { status: 'ACTIVE' as any, businessType: { in: ['BUYER' as any, 'BOTH' as any] } } }),
      this.prisma.company.count({ where: { status: 'ACTIVE' as any, businessType: { in: ['SELLER' as any, 'BOTH' as any] } } }),
      this.prisma.product.count({ where: { status: 'ACTIVE' as any, deletedAt: null } }),
      this.prisma.category.count({ where: { isActive: true, parentId: null } }),
    ])
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const [ordersToday, rfqsToday] = await Promise.all([
      this.prisma.order.count({ where: { createdAt: { gte: today } } }),
      this.prisma.rfq.count({ where: { createdAt: { gte: today } } }),
    ])
    return { companyCount, buyerCount, sellerCount, productCount, categoryCount, ordersToday, rfqsToday }
  }

  private async getMembershipContext(companyId: string): Promise<Record<string, unknown>> {
    const company = await this.prisma.company.findUnique({
      where: { id: companyId },
      select: {
        subscriptionPlan: true,
        subscriptionStatus: true,
        subscriptionActivatedAt: true,
        subscriptionExpiresAt: true,
        currentPlan: { select: { planId: true, name: true } },
      },
    })
    if (!company?.currentPlan) {
      return { planName: 'Free', status: company?.subscriptionStatus ?? 'TRIAL' }
    }
    return {
      planName: company.currentPlan.name,
      planId: company.currentPlan.planId,
      status: company.subscriptionStatus,
      activatedAt: company.subscriptionActivatedAt,
      expiresAt: company.subscriptionExpiresAt,
    }
  }
}
