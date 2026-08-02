import { Injectable, Logger } from '@nestjs/common';
import { AiGatewayService } from '../ai-gateway/ai-gateway.service';
import { PromptManagerService } from '../ai-gateway/prompt-manager.service';
import { TradTrustService } from '../tradtrust/tradtrust.service';
import { MarketplaceIntelligenceService } from '../marketplace-intelligence/marketplace-intelligence.service';
import { PrismaService } from '../../prisma/prisma.service';
import { TradeservService } from './tradeserv.service';
import { TaskType } from '@prisma/client';

@Injectable()
export class AiTradeservService {
  private readonly logger = new Logger(AiTradeservService.name);

  constructor(
    private readonly aiGateway: AiGatewayService,
    private readonly prompts: PromptManagerService,
    private readonly tradTrust: TradTrustService,
    private readonly marketplaceIntelligence: MarketplaceIntelligenceService,
    private readonly prisma: PrismaService,
    private readonly tradeserv: TradeservService,
  ) {}

  async onModuleInit() {
    await this.seedPrompt(TaskType.BIO_GENERATION, 'AI TradeServ Bio & Profile', 'professional bio, SEO profile, skills');
    await this.seedPrompt(TaskType.PROFILE_REVIEW, 'AI TradeServ Profile Review', 'profile review and suggestions');
    await this.seedPrompt(TaskType.PORTFOLIO_SUGGESTION, 'AI TradeServ Portfolio Review', 'portfolio review and suggestions');
    await this.seedPrompt(TaskType.SERVICE_DESCRIPTION, 'AI TradeServ Service Description', 'service and proposal description writing');
    await this.seedPrompt(TaskType.PRICING_SUGGESTION, 'AI TradeServ Pricing', 'pricing suggestions and market rates');
    await this.seedPrompt(TaskType.LEAD_REPLY, 'AI TradeServ Proposal Writer', 'proposal and lead reply generation');
    await this.seedPrompt(TaskType.MARKET_INSIGHT, 'AI TradeServ Market Insights', 'marketplace suggestions and growth insights');
    await this.seedPrompt(TaskType.COMPETITOR_ANALYSIS, 'AI TradeServ Competitor Analysis', 'competitor analysis and positioning');
    await this.seedPrompt(TaskType.SEO_GENERATION, 'AI TradeServ SEO', 'professional SEO content generation');
  }

  private async seedPrompt(taskType: TaskType, name: string, description: string) {
    try {
      await this.prompts.getPrompt(taskType);
    } catch {
      await this.prompts.createPrompt({
        taskType,
        name,
        description: `Default TradeServ prompt — ${description}`,
        systemPrompt: 'You are TRADINGO\'s AI TradeServ Copilot for B2B professional services. Help professionals grow their practice by generating high-quality content. Respond with valid JSON. Be specific, professional, and actionable. Use Indian market context when relevant.',
        userPrompt: 'Action: {{action}}\n\nContext:\n{{context}}\n\nProvide a structured JSON response appropriate for the action. Return ONLY valid JSON.',
        variables: ['action', 'context'],
        temperature: 0.3,
        maxTokens: 2048,
      });
      this.logger.log(`Seeded default prompt for ${taskType}`);
    }
  }

  private async processAi(taskType: TaskType, companyId: string, action: string, context: Record<string, unknown>, userId?: string) {
    return this.aiGateway.process({ taskType, payload: { action, context } }, companyId, userId);
  }

  private async getCompany(companyId: string) {
    return this.prisma.company.findUnique({
      where: { id: companyId },
      include: {
        professionalServices: { take: 20, orderBy: { createdAt: 'desc' } },
        professionalPortfolio: { take: 20, orderBy: { createdAt: 'desc' } },
        professionalCertifications: { take: 20, orderBy: { createdAt: 'desc' } },
        professionalAvailability: true,
        professionalLanguages: true,
        professionalServiceAreas: true,
      },
    });
  }

  async writeProfile(companyId: string, userId: string, payload: { name?: string; title?: string; experience?: string; skills?: string[] }) {
    const context: Record<string, unknown> = {};
    if (payload.name) context.name = payload.name;
    if (payload.title) context.title = payload.title;
    if (payload.experience) context.experience = payload.experience;
    if (payload.skills) context.skills = payload.skills;
    return this.processAi(TaskType.BIO_GENERATION, companyId, 'write_profile', context, userId);
  }

  async writeBio(companyId: string, userId: string, payload: { name?: string; title?: string; experience?: string; keywords?: string[] }) {
    const context: Record<string, unknown> = {};
    if (payload.name) context.name = payload.name;
    if (payload.title) context.title = payload.title;
    if (payload.experience) context.experience = payload.experience;
    if (payload.keywords) context.keywords = payload.keywords;
    return this.processAi(TaskType.BIO_GENERATION, companyId, 'write_bio', context, userId);
  }

  async generateSeo(companyId: string, userId: string, payload: { name?: string; description?: string; category?: string; location?: string }) {
    const context: Record<string, unknown> = {};
    if (payload.name) context.name = payload.name;
    if (payload.description) context.description = payload.description;
    if (payload.category) context.category = payload.category;
    if (payload.location) context.location = payload.location;
    return this.processAi(TaskType.SEO_GENERATION, companyId, 'professional_seo', context, userId);
  }

  async reviewPortfolio(companyId: string, userId: string, payload: { portfolioItemId?: string; title?: string; description?: string; tags?: string[] }) {
    const context: Record<string, unknown> = {};
    if (payload.portfolioItemId) {
      const company = await this.getCompany(companyId);
      const item = company?.professionalPortfolio.find(p => p.id === payload.portfolioItemId);
      if (item) context.portfolioItem = item;
    }
    if (payload.title) context.title = payload.title;
    if (payload.description) context.description = payload.description;
    if (payload.tags) context.tags = payload.tags;

    const trust = await this.tradTrust.getScore(companyId).catch(() => null);
    if (trust) context.tradTrustScore = trust.score;

    return this.processAi(TaskType.PORTFOLIO_SUGGESTION, companyId, 'review_portfolio', context, userId);
  }

  async writeProposal(companyId: string, userId: string, payload: { clientName?: string; serviceName?: string; budget?: number; requirements?: string }) {
    const context: Record<string, unknown> = {};
    if (payload.clientName) context.clientName = payload.clientName;
    if (payload.serviceName) context.serviceName = payload.serviceName;
    if (payload.budget) context.budget = payload.budget;
    if (payload.requirements) context.requirements = payload.requirements;

    const trust = await this.tradTrust.getScore(companyId).catch(() => null);
    if (trust) context.tradTrustScore = trust.score;

    return this.processAi(TaskType.LEAD_REPLY, companyId, 'write_proposal', context, userId);
  }

  async suggestPricing(companyId: string, userId: string, payload: { serviceName?: string; category?: string; deliveryDays?: number; priceMin?: number; priceMax?: number }) {
    const context: Record<string, unknown> = {};
    if (payload.serviceName) context.serviceName = payload.serviceName;
    if (payload.category) context.category = payload.category;
    if (payload.deliveryDays) context.deliveryDays = payload.deliveryDays;
    if (payload.priceMin !== undefined) context.priceMin = payload.priceMin;
    if (payload.priceMax !== undefined) context.priceMax = payload.priceMax;
    return this.processAi(TaskType.PRICING_SUGGESTION, companyId, 'suggest_pricing', context, userId);
  }

  async suggestSkills(companyId: string, userId: string, payload: { industry?: string; currentSkills?: string[]; title?: string }) {
    const context: Record<string, unknown> = {};
    if (payload.industry) context.industry = payload.industry;
    if (payload.currentSkills) context.currentSkills = payload.currentSkills;
    if (payload.title) context.title = payload.title;
    return this.processAi(TaskType.MARKET_INSIGHT, companyId, 'suggest_skills', context, userId);
  }

  async suggestCategories(companyId: string, userId: string, payload: { serviceName?: string; description?: string; currentCategory?: string }) {
    const context: Record<string, unknown> = {};
    if (payload.serviceName) context.serviceName = payload.serviceName;
    if (payload.description) context.description = payload.description;
    if (payload.currentCategory) context.currentCategory = payload.currentCategory;

    const categories = await this.tradeserv.getProfessionalCategories(false).catch(() => []);
    if (categories.length) context.existingCategories = categories;

    return this.processAi(TaskType.MARKET_INSIGHT, companyId, 'suggest_categories', context, userId);
  }

  async getRecommendations(companyId: string, _userId: string, _payload: { limit?: number }) {
    const trust = await this.tradTrust.getScore(companyId).catch(() => null);
    const company = await this.getCompany(companyId);
    return {
      success: true,
      data: {
        trustScore: trust?.score ?? null,
        trustGrade: trust ? this.getGrade(trust.score) : null,
        servicesCount: company?.professionalServices?.length ?? 0,
        portfolioCount: company?.professionalPortfolio?.length ?? 0,
        certificationsCount: company?.professionalCertifications?.length ?? 0,
        suggestions: [
          !company?.professionalServices?.length && 'Add services to attract clients',
          !company?.professionalPortfolio?.length && 'Build your portfolio to showcase work',
          !company?.description && 'Complete your professional bio',
        ].filter(Boolean),
      },
    };
  }

  async getDashboardWidgets(companyId: string) {
    const company = await this.getCompany(companyId);
    const trust = await this.tradTrust.getScore(companyId).catch(() => null);
    const stats = await this.tradeserv.getDashboardStats(companyId).catch(() => null);

    return {
      success: true,
      data: {
        profileCompletion: this.calculateProfileCompletion(company),
        trustScore: trust?.score ?? null,
        trustGrade: trust ? this.getGrade(trust.score) : null,
        servicesCount: company?.professionalServices.length ?? 0,
        portfolioCount: company?.professionalPortfolio.length ?? 0,
        certificationsCount: company?.professionalCertifications.length ?? 0,
        languagesCount: company?.professionalLanguages.length ?? 0,
        serviceAreasCount: company?.professionalServiceAreas.length ?? 0,
        ...(stats ?? {}),
      },
    };
  }

  async getMarketplaceSuggestions(companyId: string) {
    const trust = await this.tradTrust.getScore(companyId).catch(() => null);
    const company = await this.getCompany(companyId);
    const suggestions: string[] = [];

    if (!company?.description) suggestions.push('Add a professional bio to improve discovery');
    if (!company?.professionalServices?.length) suggestions.push('Add at least one service to start getting inquiries');
    if (!company?.professionalPortfolio?.length) suggestions.push('Showcase your work by adding portfolio items');
    if (!company?.professionalCertifications?.length) suggestions.push('Add certifications to build trust with clients');
    if (!company?.professionalLanguages?.length) suggestions.push('Add languages to expand your reach');
    if (!company?.professionalServiceAreas?.length) suggestions.push('Define your service areas to appear in local searches');
    if (trust && trust.score < 600) suggestions.push('Improve your TradTrust score for better visibility');
    if (company?.professionalServices && company.professionalServices.length > 0) {
      const inactiveCount = company.professionalServices.filter(s => !s.isActive).length;
      if (inactiveCount > 0) suggestions.push(`${inactiveCount} service(s) are inactive — activate them to appear in search`);
    }

    return { success: true, data: suggestions };
  }

  async getGrowthSuggestions(companyId: string) {
    const trust = await this.tradTrust.getScore(companyId).catch(() => null);
    const breakdown = await this.tradTrust.getScoreBreakdown(companyId).catch(() => null);
    const suggestions: Array<{ area: string; suggestion: string; impact: string }> = [];

    if (breakdown?.breakdown) {
      for (const factor of breakdown.breakdown) {
        if (factor.score < 50) {
          suggestions.push({
            area: factor.category,
            suggestion: `Improve your ${factor.category} score (currently ${factor.score}/100)`,
            impact: `Can increase overall trust score by up to ${Math.round(factor.weight / 10)} points`,
          });
        }
      }
    }

    if (trust && trust.score < 900) {
      suggestions.push({
        area: 'Profile Completeness',
        suggestion: 'Complete all profile sections including bio, services, portfolio, and certifications',
        impact: 'Unlocks Elite trust tier with premium visibility',
      });
    }

    return { success: true, data: suggestions };
  }

  async getFounderInsights(companyId: string) {
    const trust = await this.tradTrust.getUnifiedScore(companyId).catch(() => null);
    const suggestions: Array<{ insight: string; type: string }> = [];

    if (trust) {
      suggestions.push({
        insight: `Your business trust grade is ${trust.grade} with ${trust.riskLevel} risk level`,
        type: 'trust',
      });
    }

    const company = await this.getCompany(companyId);
    const serviceCount = company?.professionalServices?.length ?? 0;
    const portfolioCount = company?.professionalPortfolio?.length ?? 0;

    if (serviceCount === 0) {
      suggestions.push({
        insight: 'Professionals with listed services get 3x more client inquiries',
        type: 'growth',
      });
    }
    if (portfolioCount === 0) {
      suggestions.push({
        insight: 'Adding portfolio items increases client conversion by 40%',
        type: 'growth',
      });
    }

    return { success: true, data: suggestions };
  }

  async getMembershipBenefits(companyId: string) {
    const company = await this.prisma.company.findUnique({
      where: { id: companyId },
      select: {
        subscriptionPlan: true,
        subscriptionStatus: true,
        subscriptionActivatedAt: true,
        subscriptionExpiresAt: true,
      },
    });

    const plan = company?.subscriptionPlan ?? null;
    const status = company?.subscriptionStatus ?? null;
    const isActive = status === 'ACTIVE' || status === 'TRIAL';

    return {
      success: true,
      data: {
        plan,
        status,
        activatedAt: company?.subscriptionActivatedAt,
        expiresAt: company?.subscriptionExpiresAt,
        benefits: [
          { name: 'Service Listings', available: true, limit: plan === 'TRADE_ELITE' ? 'Unlimited' : 'Up to 10' },
          { name: 'AI Profile Writer', available: true },
          { name: 'AI Proposal Writer', available: true },
          { name: 'Marketplace Visibility', available: isActive },
          { name: 'TradTrust Booster', available: isActive },
          { name: 'Priority Support', available: plan === 'TRADE_PREMIUM' || plan === 'TRADE_ELITE' },
        ],
      },
    };
  }

  async getTradTrustSuggestions(companyId: string) {
    const breakdown = await this.tradTrust.getScoreBreakdown(companyId).catch(() => null);

    if (!breakdown) {
      return { success: true, data: { score: null, suggestions: ['Complete your profile to get a TradTrust score'] } };
    }

    const suggestions: Array<{ factor: string; score: number; maxScore: number; tip: string }> = [];
    for (const factor of breakdown.breakdown) {
      if (factor.score < 70) {
        suggestions.push({
          factor: factor.category,
          score: factor.score,
          maxScore: 100,
          tip: this.getTrustTip(factor.category),
        });
      }
    }

    return {
      success: true,
      data: {
        score: breakdown.unifiedScore,
        grade: breakdown.grade,
        riskLevel: breakdown.riskLevel,
        suggestions,
      },
    };
  }

  async getGocashRewards(companyId: string) {
    const wallet = await this.prisma.gOCASH_Wallet.findFirst({
      where: { companyId },
      select: {
        currentBalance: true,
        availableBalance: true,
        kycVerified: true,
        status: true,
      },
    });

    if (!wallet) {
      return { success: true, data: { balance: 0, message: 'Create a GOCASH wallet to start earning rewards' } };
    }

    return {
      success: true,
      data: {
        balance: wallet.currentBalance,
        available: wallet.availableBalance,
        kycVerified: wallet.kycVerified,
        isActive: wallet.status === 'ACTIVE',
        earningOpportunities: [
          { action: 'Complete a booking', reward: '₹50 - ₹500' },
          { action: 'Get a 5-star review', reward: '₹100' },
          { action: 'Refer another professional', reward: '₹200' },
          { action: 'Complete profile 100%', reward: '₹150' },
        ],
      },
    };
  }

  async getAnalyticsCards(companyId: string) {
    const stats = await this.tradeserv.getDashboardStats(companyId).catch(() => null);
    const analytics = await this.tradeserv.getAnalytics(companyId).catch(() => null);
    const trust = await this.tradTrust.getScore(companyId).catch(() => null);

    return {
      success: true,
      data: {
        overview: stats,
        analytics,
        trustScore: trust?.score ?? null,
        timestamp: new Date().toISOString(),
      },
    };
  }

  private calculateProfileCompletion(company: any): number {
    if (!company) return 0;
    const fields = [
      company.name, company.description, company.logo,
      company.website, company.mobile, company.email,
      company.gstNumber, company.panNumber,
    ];
    const filled = fields.filter(Boolean).length;
    const extras = [
      (company.professionalServices?.length ?? 0) > 0,
      (company.professionalPortfolio?.length ?? 0) > 0,
      (company.professionalCertifications?.length ?? 0) > 0,
      (company.professionalLanguages?.length ?? 0) > 0,
      (company.professionalServiceAreas?.length ?? 0) > 0,
    ].filter(Boolean).length;
    return Math.round(((filled + extras) / (fields.length + 5)) * 100);
  }

  private getGrade(score: number): string {
    if (score >= 900) return 'A+';
    if (score >= 750) return 'A';
    if (score >= 600) return 'B+';
    if (score >= 450) return 'B';
    if (score >= 250) return 'C';
    return 'D';
  }

  private getTrustTip(category: string): string {
    const tips: Record<string, string> = {
      verificationLevel: 'Complete KYC verification to boost this factor significantly',
      profileCompletion: 'Add all professional details including bio, website, and contact info',
      companyAge: 'This improves over time as your business establishes history',
      activeStatus: 'Keep your services active and respond to inquiries promptly',
      certifications: 'Add industry-recognized certifications to validate your expertise',
      onboarding: 'Complete the onboarding process to unlock this factor',
      orderCompletion: 'Deliver services on time to improve your completion rate',
      deliveryPerformance: 'Maintain high service quality and meet client deadlines',
      rfqQuality: 'Respond to inquiries with detailed, professional proposals',
      quoteSuccess: 'Submit competitive proposal pricing to win more clients',
      negotiationSuccess: 'Be flexible in negotiations while maintaining professional standards',
      financialHealth: 'Maintain good payment history and wallet balance',
      reputationEvents: 'Build positive reputation through completed bookings and reviews',
      marketplaceRank: 'Active engagement on the platform improves your marketplace rank',
    };
    return tips[category] ?? 'Improve this factor by engaging more actively on the platform';
  }
}
