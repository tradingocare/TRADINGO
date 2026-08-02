import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { TradeservService } from '../tradeserv/tradeserv.service';
import { AiTradeservService } from '../tradeserv/ai-tradeserv.service';
import { TradeservInquiryService } from '../tradeserv/tradeserv-inquiry.service';
import { TradTrustService } from '../tradtrust/tradtrust.service';
import { gracefulCatch } from '../../common/utils/graceful-catch';
import {
  ProfessionalDashboardCopilotResponse, ClientAcquisitionResponse, OpportunityItem,
  ProposalIntelResponse, PortfolioIntelResponse, ReputationAdvisorResponse,
  RevenuePlannerResponse, ProfessionalNotificationsResponse, TradeTalkIntegrationResponse,
  ProfessionalAgentInsightsResponse,
} from './dto/professional-agent.dto';
import { TradeAgentPriority, TradeAgentQuickAction, TradeAgentNotificationItem } from '../agent-framework/dto/agent-shared.dto';

@Injectable()
export class ProfessionalAgentService {
  private readonly logger = new Logger(ProfessionalAgentService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly tradeserv: TradeservService,
    private readonly aiTradeserv: AiTradeservService,
    private readonly inquiries: TradeservInquiryService,
    private readonly tradTrust: TradTrustService,
  ) {}

  async getDashboardCopilot(companyId: string): Promise<ProfessionalDashboardCopilotResponse> {
    const [stats, trustScore, inquiryStats, proposals, profile] = await Promise.all([
      this.tradeserv.getDashboardStats(companyId).catch(gracefulCatch('professionalAgent.getDashboardCopilot.stats', null)),
      this.tradTrust.getScore(companyId).catch(gracefulCatch('professionalAgent.getDashboardCopilot.trustScore', null)),
      this.inquiries.getInquiryStats(companyId).catch(gracefulCatch('professionalAgent.getDashboardCopilot.inquiryStats', null)),
      this.prisma.proposal.findMany({ where: { companyId }, orderBy: { createdAt: 'desc' }, take: 100, select: { id: true, status: true, amount: true, createdAt: true } }).catch(gracefulCatch('professionalAgent.getDashboardCopilot.proposals', [] as Array<{ id: string; status: string; amount: any; createdAt: Date }>)),
      this.prisma.company.findUnique({ where: { id: companyId }, select: { id: true, name: true, description: true, trustScore: true, verificationLevel: true, professionalServices: { select: { id: true, isActive: true } }, _count: { select: { professionalPortfolio: true, reviewsAsProfessional: true } } } }).catch(gracefulCatch('professionalAgent.getDashboardCopilot.profile', null)),
    ]);

    const priorities: TradeAgentPriority[] = [];
    const opportunities: TradeAgentPriority[] = [];
    const alerts: TradeAgentPriority[] = [];

    const ps = profile as any;
    const activeServices = ps?.professionalServices?.filter((s: any) => s.isActive).length ?? 0;
    const totalServices = ps?.professionalServices?.length ?? 0;
    const activeRate = totalServices > 0 ? Math.round((activeServices / totalServices) * 100) : 0;

    if (activeRate < 100 && totalServices > 0) {
      priorities.push({ title: 'Activate All Services', description: `${totalServices - activeServices} service(s) inactive — activate to appear in search`, impact: 'high', actionUrl: '/tradeserv/services', actionLabel: 'Manage Services', metric: { label: 'Inactive', value: totalServices - activeServices } });
    }
    if (!ps?.description) {
      priorities.push({ title: 'Complete Professional Bio', description: 'A complete bio increases client inquiries by 3x', impact: 'high', actionUrl: '/tradeserv/profile', actionLabel: 'Edit Bio' });
    }

    const pendingProposals = proposals.filter(p => p.status === 'DRAFT').length;
    if (pendingProposals > 0) {
      priorities.push({ title: 'Draft Proposals', description: `${pendingProposals} proposal(s) in draft — complete and send them`, impact: 'medium', actionUrl: '/tradeserv/proposals', actionLabel: 'Review', metric: { label: 'Drafts', value: pendingProposals } });
    }

    if (inquiryStats && inquiryStats.pending > 0) {
      priorities.push({ title: 'Unread Inquiries', description: `${inquiryStats.pending} inquiry(ies) waiting for response`, impact: 'high', actionUrl: '/tradeserv/inquiries', actionLabel: 'View', metric: { label: 'New', value: inquiryStats.pending } });
    }

    const ts = trustScore as any;
    if (ts && ts.score < 600) {
      opportunities.push({ title: 'Boost TradTrust Score', description: `Current score ${ts.score} — complete verification and profile`, impact: 'high', actionUrl: '/seller/settings', actionLabel: 'Improve' });
    }

    const wonProposals = proposals.filter(p => p.status === 'ACCEPTED').length;
    const totalProposals = proposals.length;
    const winRate = totalProposals > 0 ? Math.round((wonProposals / totalProposals) * 100) : 0;
    if (winRate < 30 && totalProposals > 5) {
      opportunities.push({ title: 'Improve Proposal Win Rate', description: `Win rate is ${winRate}% — review successful proposals for patterns`, impact: 'high', actionUrl: '/tradeserv/proposals', actionLabel: 'Analyze' });
    }

    const portfolioCount = (ps?._count?.professionalPortfolio as number) ?? 0;
    if (portfolioCount === 0) {
      opportunities.push({ title: 'Build Your Portfolio', description: 'Add portfolio items to showcase your work and increase conversions', impact: 'medium', actionUrl: '/tradeserv/portfolio', actionLabel: 'Add Items' });
    }

    if (ts && ts.score < 300) {
      alerts.push({ title: 'Low Trust Score Alert', description: `Your trust score is critically low (${ts.score})`, impact: 'high', actionUrl: '/seller/settings', actionLabel: 'Take Action', metric: { label: 'Score', value: ts.score } });
    }

    const quickActions: TradeAgentQuickAction[] = [
      { label: 'Manage Services', href: '/tradeserv/services', icon: 'Briefcase', priority: 'high' },
      { label: 'View Inquiries', href: '/tradeserv/inquiries', icon: 'MessageSquare', priority: 'high' },
      { label: 'Proposals', href: '/tradeserv/proposals', icon: 'FileText', priority: 'medium' },
      { label: 'Portfolio', href: '/tradeserv/portfolio', icon: 'Image', priority: 'medium' },
      { label: 'AI Tools', href: '/tradeserv/ai', icon: 'Sparkles', priority: 'medium' },
      { label: 'Analytics', href: '/tradeserv/analytics', icon: 'BarChart3', priority: 'low' },
    ];

    const metrics: Record<string, number | string> = {
      services: totalServices,
      activeServices,
      portfolioItems: portfolioCount,
      reviews: (ps?._count?.reviewsAsProfessional as number) ?? 0,
      inquiries: inquiryStats?.total ?? 0,
      proposals: totalProposals,
      trustScore: ts?.score ?? 0,
      winRate,
    };

    return { priorities, quickActions, urgentAlerts: alerts, growthOpportunities: opportunities, metrics };
  }

  async getClientAcquisition(companyId: string): Promise<ClientAcquisitionResponse> {
    const [company, categories, communities] = await Promise.all([
      this.prisma.company.findUnique({
        where: { id: companyId },
        select: { professionalType: true, professionalServices: { select: { category: true, name: true } }, locations: { select: { city: true, state: true } } },
      }),
      this.tradeserv.getProfessionalCategories(false).catch(gracefulCatch('professionalAgent.getClientAcquisition.categories', [] as any[])),
      this.prisma.community.findMany({ where: { isActive: true }, take: 10, select: { id: true, name: true, memberCount: true }, orderBy: { memberCount: 'desc' } }).catch(gracefulCatch('professionalAgent.getClientAcquisition.communities', [] as Array<{ id: string; name: string; memberCount: number }>)),
    ]);

    const compAny = company as any;
    const myCategories: string[] = (compAny?.professionalServices?.map((s: any) => s.category).filter(Boolean) as string[]) || [];
    const myCity = (compAny?.locations as any[])?.[0]?.city as string | undefined;

    const marketplaceDemand: OpportunityItem[] = [];
    const nearbyOpportunities: OpportunityItem[] = [];

    for (const cat of (categories as any[]).slice(0, 10)) {
      const catName = cat.category || '';
      const catCount = (cat._count?.category as number) || 0;
      if (myCategories.includes(catName) || !catName) continue;
      marketplaceDemand.push({
        title: catName,
        description: `${catCount} professional(s) listed in this category`,
        demandLevel: catCount > 10 ? 'high' : catCount > 3 ? 'medium' : 'low',
        competitionLevel: catCount > 20 ? 'high' : catCount > 5 ? 'medium' : 'low',
        potentialScore: Math.min(95, 100 - (catCount * 3)),
        actionUrl: `/tradeserv?category=${encodeURIComponent(catName)}`,
      });
    }

    if (myCity) {
      const nearbyPros = await this.prisma.company.count({
        where: { professionalType: { not: null }, locations: { some: { city: myCity } }, id: { not: companyId } },
      }).catch(gracefulCatch('professionalAgent.getClientAcquisition.nearbyPros', 0));
      nearbyOpportunities.push({
        title: `${myCity} Area`,
        description: `${nearbyPros} professional(s) in your area`,
        demandLevel: nearbyPros > 20 ? 'high' : nearbyPros > 5 ? 'medium' : 'low',
        competitionLevel: nearbyPros > 20 ? 'high' : nearbyPros > 5 ? 'medium' : 'low',
        potentialScore: Math.min(90, 100 - (nearbyPros * 2)),
        actionUrl: `/tradeserv?location=${encodeURIComponent(myCity)}`,
      });
    }

    const tradeTalkCommunities = communities.map(c => ({
      id: c.id, name: c.name, memberCount: c.memberCount,
      relevance: myCategories.length > 0 ? 'high' : 'medium',
    }));

    const recommendations: string[] = [];
    if (myCategories.length === 0) recommendations.push('Add services with categories to appear in marketplace search');
    if (!myCity) recommendations.push('Add your location to be discovered in nearby searches');
    if (tradeTalkCommunities.length === 0) recommendations.push('Join TradeTalk communities to expand your professional network');

    return { marketplaceDemand: marketplaceDemand.slice(0, 5), nearbyOpportunities, tradeTalkCommunities, recommendations };
  }

  async getProposalIntelligence(companyId: string): Promise<ProposalIntelResponse> {
    const [proposals, inquiries] = await Promise.all([
      this.prisma.proposal.findMany({ where: { companyId }, orderBy: { createdAt: 'desc' }, take: 200, select: { id: true, status: true, amount: true, sentAt: true, createdAt: true, rejectionReason: true, client: { select: { name: true } } } }).catch(gracefulCatch('professionalAgent.getProposalIntelligence.proposals', [] as Array<{ id: string; status: any; amount: any; sentAt: Date | null; createdAt: Date; rejectionReason: string | null; client: { name: string } | null }>)),
      this.prisma.professionalInquiry.findMany({ where: { companyId }, orderBy: { createdAt: 'desc' }, take: 100, select: { id: true, clientName: true, requirement: true, budget: true, status: true, createdAt: true } }).catch(gracefulCatch('professionalAgent.getProposalIntelligence.inquiries', [] as Array<{ id: string; clientName: string; requirement: string | null; budget: string | null; status: string; createdAt: Date }>)),
    ]);

    const totalProposals = proposals.length;
    const accepted = proposals.filter(p => p.status === 'ACCEPTED').length;
    const rejected = proposals.filter(p => p.status === 'REJECTED').length;
    const responded = accepted + rejected;
    const winRate = responded > 0 ? Math.round((accepted / responded) * 100) : 0;

    const totalAmount = (proposals as any[]).reduce((s: number, p: any) => s + Number(p.amount || 0), 0);
    const avgAmount = totalProposals > 0 ? Math.round(totalAmount / totalProposals) : 0;

    const pricingInsights: Array<{ label: string; value: string; type: 'competitive' | 'premium' | 'economy' }> = [];
    if (avgAmount > 0) {
      pricingInsights.push(
        { label: 'Average Proposal', value: `₹${avgAmount.toLocaleString()}`, type: 'competitive' },
        { label: 'Low Range', value: `₹${Math.round(avgAmount * 0.6).toLocaleString()}`, type: 'economy' },
        { label: 'Premium Range', value: `₹${Math.round(avgAmount * 1.4).toLocaleString()}`, type: 'premium' },
      );
    }

    const riskIndicators: Array<{ factor: string; severity: 'high' | 'medium' | 'low'; description: string }> = [];
    if (winRate < 25 && totalProposals > 10) {
      riskIndicators.push({ factor: 'Low Win Rate', severity: 'high', description: `Only ${winRate}% of proposals are accepted — review pricing and content quality` });
    }
    if (rejected > accepted && responded > 0) {
      riskIndicators.push({ factor: 'High Rejection Rate', severity: 'high', description: 'More proposals rejected than accepted — consider competitive analysis' });
    }
    if (totalProposals > 0 && avgAmount < 1000) {
      riskIndicators.push({ factor: 'Low Value Proposals', severity: 'medium', description: 'Average proposal value is low — consider upselling additional services' });
    }

    const now = new Date();
    const followUpSuggestions: Array<{ proposalId: string; clientName: string; daysSinceSent: number; suggestedAction: string }> = [];
    for (const p of proposals) {
      if (p.status === 'SENT' && p.sentAt) {
        const daysSinceSent = Math.floor((now.getTime() - new Date(p.sentAt).getTime()) / 86400000);
        if (daysSinceSent >= 7 && daysSinceSent < 30) {
          followUpSuggestions.push({
            proposalId: p.id, clientName: p.client?.name || 'Client',
            daysSinceSent, suggestedAction: 'Send a follow-up reminder',
          });
        } else if (daysSinceSent >= 30) {
          followUpSuggestions.push({
            proposalId: p.id, clientName: p.client?.name || 'Client',
            daysSinceSent, suggestedAction: 'Re-engage with revised proposal',
          });
        }
      }
    }

    const improvements: string[] = [];
    if (totalProposals === 0) improvements.push('Start responding to inquiries with professional proposals');
    if (winRate < 40) improvements.push('Study accepted proposals to identify winning patterns');
    if (inquiries.length > proposals.length * 2) improvements.push('Improve inquiry-to-proposal conversion rate');

    return {
      totalProposals, winRate, averageProposalScore: avgAmount,
      pricingInsights, riskIndicators,
      followUpSuggestions: followUpSuggestions.slice(0, 5),
      improvements,
    };
  }

  async getPortfolioIntelligence(companyId: string): Promise<PortfolioIntelResponse> {
    const [portfolio, services, company] = await Promise.all([
      this.prisma.professionalPortfolio.findMany({ where: { companyId }, select: { id: true, title: true, description: true, tags: true, media: true } }),
      this.prisma.professionalService.findMany({ where: { companyId }, select: { id: true, name: true, category: true, isActive: true } }),
      this.prisma.company.findUnique({ where: { id: companyId }, select: { description: true } }),
    ]);

    const itemCount = portfolio.length;
    const serviceCategories = new Set(services.map(s => s.category).filter(Boolean));
    const coveredCategories = new Set(services.filter(s => s.isActive).map(s => s.category).filter(Boolean));

    const coverageAreas: string[] = Array.from(serviceCategories).filter(Boolean) as string[];

    const allCategories = await this.prisma.professionalService.groupBy({
      by: ['category'],
      where: { category: { not: null } },
      _count: true,
      orderBy: { _count: { category: 'desc' } },
      take: 10,
    });
    const missingIndustries = allCategories.filter(c => c.category && !coveredCategories.has(c.category)).map(c => c.category!).slice(0, 5);

    const itemsWithMedia = portfolio.filter(p => p.media).length;
    const itemsWithDesc = portfolio.filter(p => p.description).length;
    const mediaQuality: 'excellent' | 'good' | 'needs_improvement' =
      itemsWithMedia >= itemCount * 0.8 && itemsWithDesc >= itemCount * 0.8 ? 'excellent' :
      itemsWithMedia >= itemCount * 0.5 ? 'good' : 'needs_improvement';

    const scoreFields = [itemCount > 0 ? 20 : 0, coverageAreas.length > 0 ? 20 : 0, itemsWithMedia > 0 ? 20 : 0, itemsWithDesc > 0 ? 20 : 0, company?.description ? 20 : 0];
    const portfolioQualityScore = scoreFields.reduce((s, v) => s + v, 0);

    const suggestions: string[] = [];
    if (itemCount === 0) suggestions.push('Add at least 3-5 portfolio items to showcase your expertise');
    if (itemsWithMedia < itemCount) suggestions.push(`Add media to ${itemCount - itemsWithMedia} portfolio item(s) without visuals`);
    if (itemsWithDesc < itemCount) suggestions.push(`Add descriptions to ${itemCount - itemsWithDesc} portfolio item(s)`);
    if (missingIndustries.length > 0) suggestions.push(`Expand into high-demand areas: ${missingIndustries.slice(0, 3).join(', ')}`);

    return { portfolioQualityScore, itemCount, coverageAreas, missingIndustries, mediaQuality, suggestions };
  }

  async getReputationAdvisor(companyId: string): Promise<ReputationAdvisorResponse> {
    const [breakdown, reviewsAgg, company] = await Promise.all([
      this.tradTrust.getScoreBreakdown(companyId).catch(gracefulCatch('professionalAgent.getReputationAdvisor.breakdown', null)),
      this.prisma.professionalReview.aggregate({ where: { companyId }, _avg: { rating: true }, _count: true }),
      this.prisma.company.findUnique({
        where: { id: companyId },
        select: { trustScore: true, verificationLevel: true, responseTimeMinutes: true, description: true, logo: true, website: true, email: true, mobile: true, gstNumber: true, panNumber: true, _count: { select: { professionalServices: true, professionalPortfolio: true, professionalCertifications: true, professionalLanguages: true } } },
      }),
    ]);

    const trustScore = company?.trustScore ?? 0;
    const verificationLevel = company?.verificationLevel ?? 'UNVERIFIED';
    const averageRating = reviewsAgg._avg.rating || 0;
    const reviewCount = reviewsAgg._count || 0;

    const responseRate = company?.responseTimeMinutes !== null && company?.responseTimeMinutes !== undefined
      ? (company.responseTimeMinutes < 60 ? 95 : company.responseTimeMinutes < 240 ? 75 : company.responseTimeMinutes < 1440 ? 50 : 25)
      : 0;

    const profileFields = [company?.description, company?.logo, company?.website, company?.email, company?.mobile, company?.gstNumber, company?.panNumber];
    const filledFields = profileFields.filter(Boolean).length;
    const extraFields = [(company?._count?.professionalServices ?? 0) > 0, (company?._count?.professionalPortfolio ?? 0) > 0, (company?._count?.professionalCertifications ?? 0) > 0, (company?._count?.professionalLanguages ?? 0) > 0];
    const filledExtras = extraFields.filter(Boolean).length;
    const profileCompleteness = Math.round(((filledFields + filledExtras) / (profileFields.length + extraFields.length)) * 100);

    const improvementPlan: Array<{ area: string; action: string; impact: 'high' | 'medium' | 'low'; expectedOutcome: string }> = [];
    if (!company?.description) improvementPlan.push({ area: 'Bio', action: 'Write a professional bio', impact: 'high', expectedOutcome: '+15% profile views' });
    if (!company?.logo) improvementPlan.push({ area: 'Logo', action: 'Upload a professional logo', impact: 'high', expectedOutcome: '+20% trust perception' });
    if (profileCompleteness < 80) improvementPlan.push({ area: 'Profile', action: `Complete profile to ${100 - profileCompleteness}%`, impact: 'high', expectedOutcome: 'Better search ranking' });
    if (responseRate < 75) improvementPlan.push({ area: 'Response Time', action: 'Respond to inquiries within 1 hour', impact: 'medium', expectedOutcome: '+10% conversion rate' });
    if (reviewCount < 5) improvementPlan.push({ area: 'Reviews', action: 'Request reviews from completed bookings', impact: 'medium', expectedOutcome: '+5% trust score' });
    if (verificationLevel === 'UNVERIFIED') improvementPlan.push({ area: 'Verification', action: 'Complete KYC verification', impact: 'high', expectedOutcome: 'Unlocks premium features + trust boost' });

    const grade = trustScore >= 900 ? 'A+' : trustScore >= 750 ? 'A' : trustScore >= 600 ? 'B+' : trustScore >= 450 ? 'B' : trustScore >= 250 ? 'C' : 'D';
    const riskLevel = trustScore >= 750 ? 'Low' : trustScore >= 450 ? 'Moderate' : 'High';

    const brkdwn = breakdown as any;
    const breakdownFactors = brkdwn?.breakdown?.map((f: any) => ({
      category: f.category,
      score: f.score,
      contribution: f.contribution,
      maxContribution: f.maxContribution,
    })) || [];

    return {
      trustScore, trustGrade: grade, riskLevel,
      averageRating, reviewCount, responseRate,
      profileCompleteness, verificationLevel,
      breakdown: breakdownFactors, improvementPlan,
    };
  }

  async getRevenuePlanner(companyId: string): Promise<RevenuePlannerResponse> {
    const [proposals, inquiries, bookings, company] = await Promise.all([
      this.prisma.proposal.findMany({ where: { companyId }, orderBy: { createdAt: 'desc' }, take: 200, select: { id: true, status: true, amount: true, createdAt: true } }).catch(gracefulCatch('professionalAgent.getRevenuePlanner.proposals', [] as Array<{ id: string; status: string; amount: any; createdAt: Date }>)),
      this.prisma.professionalInquiry.findMany({ where: { companyId, status: 'NEW' }, take: 50, select: { id: true, clientName: true, budget: true, createdAt: true } }).catch(gracefulCatch('professionalAgent.getRevenuePlanner.inquiries', [] as Array<{ id: string; clientName: string; budget: string | null; createdAt: Date }>)),
      this.prisma.booking.findMany({ where: { companyId }, select: { id: true, status: true, createdAt: true }, orderBy: { createdAt: 'asc' } }).catch(gracefulCatch('professionalAgent.getRevenuePlanner.bookings', [] as Array<{ id: string; status: string; createdAt: Date }>)),
      this.prisma.company.findUnique({ where: { id: companyId }, select: { subscriptionPlan: true } }),
    ]);

    const acceptedProposals = proposals.filter(p => p.status === 'ACCEPTED');
    const currentRevenue = acceptedProposals.reduce((s, p) => s + Number(p.amount || 0), 0);

    const pipelineProposals = proposals.filter(p => p.status === 'SENT' || p.status === 'DRAFT');
    const pipelineValue = pipelineProposals.reduce((s, p) => s + Number(p.amount || 0), 0);

    const inquiryValue = inquiries.reduce((s, i) => {
      const budget = i.budget ? parseInt(i.budget.replace(/[^0-9]/g, ''), 10) : 0;
      return s + (isNaN(budget) ? 0 : budget * 0.3);
    }, 0);

    const forecastedRevenue = currentRevenue + (pipelineValue * 0.4) + (inquiryValue * 0.2);

    const monthlyTrend: Array<{ month: string; revenue: number; bookings: number }> = [];
    const last12Months: Date[] = [];
    const now = new Date();
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      last12Months.push(d);
    }
    for (const month of last12Months) {
      const monthKey = month.toLocaleString('en-US', { month: 'short', year: 'numeric' });
      const mAccepted = acceptedProposals.filter(p => {
        const d = new Date(p.createdAt);
        return d.getMonth() === month.getMonth() && d.getFullYear() === month.getFullYear();
      });
      const mBookings = bookings.filter(b => {
        const d = new Date(b.createdAt);
        return d.getMonth() === month.getMonth() && d.getFullYear() === month.getFullYear();
      });
      monthlyTrend.push({ month: monthKey, revenue: mAccepted.reduce((s, p) => s + Number(p.amount || 0), 0), bookings: mBookings.length });
    }

    const conversionOpportunities = inquiries.slice(0, 5).map(i => ({
      inquiryId: i.id,
      clientName: i.clientName || 'Unknown',
      value: i.budget ? parseInt(i.budget.replace(/[^0-9]/g, ''), 10) || 0 : 0,
      probability: 30,
      stage: 'inquiry' as const,
    }));

    const compAny = company as any;
    const plan = compAny?.subscriptionPlan as string | undefined;
    const monthlyTarget = plan === 'TRADE_ELITE' ? 500000 : plan === 'TRADE_PREMIUM' ? 300000 : plan === 'TRADE_PLUS' ? 200000 : 100000;
    const goals: Array<{ category: string; target: string; current: number; priority: 'high' | 'medium' | 'low' }> = [];
    goals.push({ category: 'Revenue', target: `₹${monthlyTarget.toLocaleString()}/month`, current: currentRevenue, priority: 'high' });
    goals.push({ category: 'Proposals', target: '20 proposals/month', current: proposals.length, priority: 'medium' });
    goals.push({ category: 'Bookings', target: '10 bookings/month', current: bookings.length, priority: 'medium' });

    const recommendations: string[] = [];
    if (currentRevenue === 0) recommendations.push('Start by responding to inquiries and sending proposals');
    if (pipelineValue < monthlyTarget * 0.5) recommendations.push('Increase your proposal pipeline to meet revenue targets');
    if (conversionOpportunities.length > 0) recommendations.push(`Follow up on ${conversionOpportunities.length} pending inquiries`);

    return { currentRevenue, revenueTarget: monthlyTarget, pipelineValue, forecastedRevenue, monthlyTrend, conversionOpportunities, goals, recommendations };
  }

  async getNotifications(companyId: string): Promise<ProfessionalNotificationsResponse> {
    const [inquiryStats, proposals, reviews, trustScore] = await Promise.all([
      this.inquiries.getInquiryStats(companyId).catch(gracefulCatch('professionalAgent.getNotifications.inquiryStats', null)),
      this.prisma.proposal.findMany({ where: { companyId }, orderBy: { createdAt: 'desc' }, take: 50, select: { id: true, status: true, sentAt: true, createdAt: true, client: { select: { name: true } } } }).catch(gracefulCatch('professionalAgent.getNotifications.proposals', [] as Array<{ id: string; status: string; sentAt: Date | null; createdAt: Date; client: { name: string } | null }>)),
      this.prisma.professionalReview.findMany({ where: { companyId }, orderBy: { createdAt: 'desc' }, take: 10, select: { id: true, rating: true, title: true, createdAt: true } }).catch(gracefulCatch('professionalAgent.getNotifications.reviews', [] as Array<{ id: string; rating: number; title: string | null; createdAt: Date }>)),
      this.tradTrust.getScore(companyId).catch(gracefulCatch('professionalAgent.getNotifications.trustScore', null)),
    ]);

    const criticalAlerts: TradeAgentNotificationItem[] = [];
    const milestones: TradeAgentNotificationItem[] = [];
    const insights: TradeAgentNotificationItem[] = [];
    const reminders: TradeAgentNotificationItem[] = [];
    const opportunities: TradeAgentNotificationItem[] = [];

    const iStats = inquiryStats as any;
    if (iStats && iStats.pending > 0) {
      criticalAlerts.push({ type: 'alert', title: 'New Inquiries', body: `${iStats.pending} inquiry(ies) waiting for your response`, priority: 'critical', link: '/tradeserv/inquiries', createdAt: new Date() });
    }

    const sentProposals = proposals.filter(p => p.status === 'SENT');
    const now = new Date();
    for (const p of sentProposals.slice(0, 5)) {
      if (p.sentAt) {
        const daysSince = Math.floor((now.getTime() - new Date(p.sentAt).getTime()) / 86400000);
        if (daysSince >= 7) {
          reminders.push({ type: 'reminder', title: 'Follow-up Needed', body: `Proposal to ${p.client?.name || 'client'} sent ${daysSince} days ago`, priority: 'medium', link: `/tradeserv/proposals/${p.id}`, createdAt: p.sentAt });
        }
      }
    }

    if (reviews.length > 0) {
      const recentGoodReview = reviews.find(r => r.rating >= 4);
      if (recentGoodReview) {
        milestones.push({ type: 'milestone', title: 'Great Review!', body: `"${recentGoodReview.title || 'Client review'}" — ${recentGoodReview.rating}/5 stars`, priority: 'low', createdAt: recentGoodReview.createdAt });
      }
    }

    const ts = trustScore as any;
    if (ts && ts.score >= 750) {
      milestones.push({ type: 'milestone', title: 'Strong TradTrust Score', body: `Your trust score is ${ts.score}/1000 — premium tier`, priority: 'low', createdAt: new Date() });
    }

    const acceptedProposals = proposals.filter(p => p.status === 'ACCEPTED');
    if (acceptedProposals.length >= 5) {
      milestones.push({ type: 'milestone', title: 'Proposal Milestone', body: `${acceptedProposals.length} proposals accepted — great momentum!`, priority: 'low', createdAt: new Date() });
    }

    if (iStats && iStats.total > 0 && iStats.pending === 0) {
      insights.push({ type: 'insight', title: 'Inquiries Cleared', body: 'All inquiries have been addressed — good response time!', priority: 'low', createdAt: new Date() });
    }

    if (iStats && iStats.pending > 0) {
      opportunities.push({ type: 'opportunity', title: 'Respond to Inquiries', body: `${iStats.pending} potential clients waiting — respond now to convert`, priority: 'high', link: '/tradeserv/inquiries', createdAt: new Date() });
    }

    const proposalsNeedingFollowUp = sentProposals.filter(p => p.sentAt && Math.floor((now.getTime() - new Date(p.sentAt).getTime()) / 86400000) >= 7).length;
    if (proposalsNeedingFollowUp > 0) {
      opportunities.push({ type: 'opportunity', title: 'Follow-up Proposals', body: `${proposalsNeedingFollowUp} proposal(s) need follow-up — increase your close rate`, priority: 'medium', link: '/tradeserv/proposals', createdAt: new Date() });
    }

    const dailyDigest = `${iStats?.pending || 0} pending inquiries, ${proposals.length} proposals, ${reviews.length} reviews, trust score ${ts?.score || 0}`;

    return { dailyDigest, criticalAlerts, milestones, insights, reminders, opportunities };
  }

  async getTradeTalkIntegration(companyId: string): Promise<TradeTalkIntegrationResponse> {
    const [company, communities, members] = await Promise.all([
      this.prisma.company.findUnique({
        where: { id: companyId },
        select: { professionalType: true, professionalServices: { select: { category: true } } },
      }),
      this.prisma.community.findMany({ where: { isActive: true }, take: 20, orderBy: { memberCount: 'desc' }, select: { id: true, name: true, description: true, tags: true, memberCount: true } }).catch(gracefulCatch('professionalAgent.getTradeTalkIntegration.communities', [] as Array<{ id: string; name: string; description: string | null; tags: string[]; memberCount: number }>)),
      this.prisma.communityMember.findMany({ where: { userId: companyId }, select: { communityId: true } }).catch(gracefulCatch('professionalAgent.getTradeTalkIntegration.members', [] as Array<{ communityId: string }>)),
    ]);

    const myCategories = ((company as any)?.professionalServices?.map((s: any) => s.category).filter(Boolean) as string[]) || [];
    const myCommunityIds = new Set(members.map(m => m.communityId));

    const recommendedCommunities = communities
      .filter(c => !myCommunityIds.has(c.id))
      .slice(0, 10)
      .map(c => ({
        id: c.id,
        name: c.name,
        description: c.description || '',
        memberCount: c.memberCount,
        relevanceScore: c.memberCount > 100 ? 90 : c.memberCount > 50 ? 70 : 50,
        tags: c.tags as string[],
      }));

    const totalCommunities = communities.length;
    const totalMembers = communities.reduce((s, c) => s + c.memberCount, 0);

    const industryCount: Record<string, number> = {};
    for (const c of communities) {
      const tags = c.tags as string[];
      for (const tag of tags) {
        industryCount[tag] = (industryCount[tag] || 0) + 1;
      }
    }
    const topIndustries = Object.entries(industryCount)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([name, count]) => ({ name, count }));

    return {
      recommendedCommunities,
      activeDiscussions: [],
      networkingSuggestions: [],
      communityInsights: { totalCommunities, totalMembers, topIndustries },
    };
  }

  async getAllInsights(companyId: string): Promise<ProfessionalAgentInsightsResponse> {
    const [dashboardCopilot, clientAcquisition, proposalIntelligence, portfolioIntelligence, reputationAdvisor, revenuePlanner, notifications, tradeTalkIntegration] = await Promise.all([
      this.getDashboardCopilot(companyId),
      this.getClientAcquisition(companyId),
      this.getProposalIntelligence(companyId),
      this.getPortfolioIntelligence(companyId),
      this.getReputationAdvisor(companyId),
      this.getRevenuePlanner(companyId),
      this.getNotifications(companyId),
      this.getTradeTalkIntegration(companyId),
    ]);
    return { dashboardCopilot, clientAcquisition, proposalIntelligence, portfolioIntelligence, reputationAdvisor, revenuePlanner, notifications, tradeTalkIntegration };
  }
}
