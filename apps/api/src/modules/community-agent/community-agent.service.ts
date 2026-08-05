import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { TradeTalkService } from '../tradetalk/tradetalk.service';
import { AiTradeTalkService } from '../tradetalk/ai-tradetalk.service';
import { TradTrustService } from '../tradtrust/tradtrust.service';
import { TradeAgentFederationService } from '../ai-federation/trade-agent-federation.service';
import {
  CommunityDashboardCopilotResponse, NetworkingAdvisorResponse,
  CommunityIntelligenceResponse, KnowledgeDiscoveryResponse,
  CollaborationAdvisorResponse, CommunityReputationResponse,
  CommunityNotificationsResponse, CommunityAnalyticsResponse,
  CommunityAgentInsightsResponse,
} from './dto/community-agent.dto';
import { TradeAgentPriority, TradeAgentQuickAction, TradeAgentNotificationItem } from '../agent-framework/dto/agent-shared.dto';
import { gracefulCatch } from '../../common/utils/graceful-catch';

@Injectable()
export class CommunityAgentService {
  private readonly logger = new Logger(CommunityAgentService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly tradeTalk: TradeTalkService,
    private readonly aiTradeTalk: AiTradeTalkService,
    private readonly tradTrust: TradTrustService,
    private readonly federation: TradeAgentFederationService,
  ) {}

  async getDashboardCopilot(companyId: string, userId: string): Promise<CommunityDashboardCopilotResponse> {
    const [dashboard, communities, userEmail, allCommunities] = await Promise.all([
      this.tradeTalk.getDashboardStats(userId).catch(gracefulCatch('communityAgent.getDashboardCopilot.dashboardStats', null)),
      this.prisma.communityMember.findMany({
        where: { userId, status: 'ACTIVE' },
        include: { community: { select: { id: true, name: true, slug: true, memberCount: true } } },
        take: 10,
      }).catch(gracefulCatch('communityAgent.getDashboardCopilot.myCommunities', [] as Array<{ community: { id: string; name: string; slug: string; memberCount: number } }>)),
      this.prisma.user.findUnique({ where: { id: userId }, select: { email: true } }).catch(gracefulCatch('communityAgent.getDashboardCopilot.userEmail', null)),
      this.prisma.community.findMany({
        where: { deletedAt: null, isActive: true },
        orderBy: { memberCount: 'desc' },
        take: 5,
        select: { id: true, name: true, slug: true, memberCount: true, description: true },
      }).catch(gracefulCatch('communityAgent.getDashboardCopilot.allCommunities', [] as Array<{ id: string; name: string; slug: string; memberCount: number; description: string | null }>)),
    ]);

    const myCommunityIds = new Set(communities.map(m => m.community.id));
    const recommendedCommunities = allCommunities
      .filter(c => !myCommunityIds.has(c.id))
      .slice(0, 3)
      .map(c => ({ id: c.id, name: c.name, slug: c.slug, memberCount: c.memberCount, matchReason: 'Popular community' }));

    const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000);
    const [trendingIndustries, pendingInvitations] = await Promise.all([
      this.prisma.industryRoom.groupBy({
        by: ['industryId'],
        where: { industryId: { not: null }, community: { deletedAt: null, isActive: true }, createdAt: { gte: thirtyDaysAgo } },
        _count: { id: true },
        orderBy: { _count: { id: 'desc' } },
        take: 5,
      }),
      userEmail?.email
        ? this.prisma.communityInvitation.count({ where: { email: userEmail.email, status: 'PENDING', expiresAt: { gte: new Date() } } })
        : Promise.resolve(0),
    ]);

    const industryIds = trendingIndustries.filter(r => r.industryId).map(r => r.industryId!) as string[];
    const industries = industryIds.length
      ? await this.prisma.industry.findMany({ where: { id: { in: industryIds } }, select: { id: true, name: true } })
      : [];

    const alerts: TradeAgentPriority[] = [];
    if (pendingInvitations > 0) {
      alerts.push({ title: 'Pending Invitations', description: `You have ${pendingInvitations} community invitation(s) waiting`, impact: 'high', actionUrl: '/tradetalk/invitations', actionLabel: 'View', metric: { label: 'Invitations', value: pendingInvitations } });
    }
    if ((dashboard as any)?.myCommunityCount === 0) {
      alerts.push({ title: 'Join Communities', description: 'Join communities to expand your professional network', impact: 'medium', actionUrl: '/tradetalk/communities', actionLabel: 'Explore' });
    }

    const metrics: Record<string, number | string> = {
      myCommunities: (dashboard as any)?.myCommunityCount ?? 0,
      totalMembers: (dashboard as any)?.totalMembersAcrossCommunities ?? 0,
      pendingInvitations,
      totalPlatformCommunities: (dashboard as any)?.recommended?.length ?? 0,
    };

    const quickActions: TradeAgentQuickAction[] = [
      { label: 'Discover Communities', href: '/tradetalk/communities', icon: 'Search', priority: 'high' },
      { label: 'My Communities', href: '/tradetalk/my', icon: 'Users', priority: 'medium' },
      { label: 'Invitations', href: '/tradetalk/invitations', icon: 'Mail', priority: 'medium' },
      { label: 'Rankings', href: '/tradetalk/rankings', icon: 'Trophy', priority: 'low' },
    ];

    return {
      todaysDiscussions: [],
      trendingIndustries: trendingIndustries.map(r => ({
        name: industries.find(i => i.id === r.industryId)?.name || 'Unknown',
        communityCount: r._count.id,
        growth: 0,
      })),
      recommendedCommunities,
      networkingSuggestions: 0,
      pendingInvitations,
      alerts,
      metrics,
      quickActions,
    };
  }

  async getNetworkingAdvisor(companyId: string, userId: string): Promise<NetworkingAdvisorResponse> {
    const [user, myCommunities, leaders, nearbyPros] = await Promise.all([
      this.prisma.company.findUnique({
        where: { id: companyId },
        select: { id: true, name: true, slug: true, trustScore: true, industries: { include: { industry: true } }, locations: { take: 1, where: { isPrimary: true } } },
      }),
      this.prisma.communityMember.findMany({
        where: { userId, status: 'ACTIVE' },
        include: { community: { select: { id: true, name: true, memberCount: true, tags: true } } },
        take: 50,
      }).catch(gracefulCatch('communityAgent.getNetworkingAdvisor.myCommunities', [])),
      this.tradeTalk.getCommunityLeaders(20).catch(gracefulCatch('communityAgent.getNetworkingAdvisor.leaders', [])),
      this.prisma.company.findMany({
        where: { professionalType: { not: null }, id: { not: companyId }, professionalStatus: 'APPROVED' as any },
        orderBy: { trustScore: 'desc' },
        take: 10,
        select: { id: true, name: true, slug: true, professionalType: true, trustScore: true, description: true, locations: { select: { city: true }, take: 1 } },
      }).catch(gracefulCatch('communityAgent.getNetworkingAdvisor.nearbyPros', [] as Array<{ id: string; name: string; slug: string; professionalType: string | null; trustScore: number | null; description: string | null; locations: Array<{ city: string }> }>)),
    ]);

    const myIndustryIds = new Set((user as any)?.industries?.map((ci: any) => ci.industry?.id).filter(Boolean) || []);
    const myCommunityIds = new Set(myCommunities.map(m => m.community.id));

    const recommendedBusinesses = [];
    const companiesWithMatchingIndustry = await this.prisma.company.findMany({
      where: {
        id: { not: companyId },
        industries: { some: { industryId: { in: Array.from(myIndustryIds) as string[] } } },
      },
      orderBy: { trustScore: 'desc' },
      take: 10,
      select: { id: true, name: true, slug: true, trustScore: true, industries: { include: { industry: { select: { name: true } } }, take: 1 }, locations: { select: { city: true, state: true }, take: 1 } },
    }).catch(gracefulCatch('communityAgent.getNetworkingAdvisor.companiesWithMatchingIndustry', []));
    for (const c of companiesWithMatchingIndustry) {
      recommendedBusinesses.push({
        companyId: c.id, name: c.name, slug: c.slug,
        trustScore: c.trustScore ?? 0,
        industry: (c.industries as any[])?.[0]?.industry?.name || '',
        location: `${(c.locations as any[])?.[0]?.city || ''} ${(c.locations as any[])?.[0]?.state || ''}`.trim(),
        reason: 'Same industry',
      });
    }

    const recommendedProfessionals = nearbyPros.map(p => ({
      companyId: p.id, name: p.name, slug: p.slug,
      professionalType: p.professionalType || 'Professional',
      trustScore: p.trustScore ?? 0,
      reason: `Based in ${(p.locations as any[])?.[0]?.city || 'your area'}`,
    }));

    const indExperts = leaders.map(l => ({
      userId: l.userId || '',
      name: (l.user as any)?.name || 'Unknown',
      communitiesLed: l.communityCount,
      trustScore: (l.primaryCompany as any)?.trustScore ?? 0,
      expertise: [],
    }));

    const potentialPartners: Array<{ companyId: string; name: string; trustScore: number; mutualCommunities: number; reason: string }> = [];
    const memberCompanies = await this.prisma.communityMember.findMany({
      where: { communityId: { in: Array.from(myCommunityIds) as string[] }, status: 'ACTIVE', userId: { not: userId } },
      include: { user: { include: { ownedCompanies: { include: { company: { select: { id: true, name: true, trustScore: true } } }, take: 1 } } } },
      take: 20,
    }).catch(gracefulCatch('communityAgent.getNetworkingAdvisor.memberCompanies', [] as any[]));
    const seenCompanies = new Set<string>();
    for (const m of memberCompanies) {
      const memberUser = (m as any).user;
      const co = memberUser?.ownedCompanies?.[0]?.company;
      if (co && !seenCompanies.has(co.id)) {
        seenCompanies.add(co.id);
        potentialPartners.push({ companyId: co.id, name: co.name, trustScore: co.trustScore ?? 0, mutualCommunities: 1, reason: 'Same community member' });
      }
    }

    return {
      recommendedBusinesses: recommendedBusinesses.slice(0, 10),
      recommendedProfessionals: recommendedProfessionals.slice(0, 10),
      industryExperts: indExperts.slice(0, 10),
      potentialPartners: potentialPartners.slice(0, 10),
    };
  }

  async getCommunityIntelligence(_companyId: string): Promise<CommunityIntelligenceResponse> {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000);
    const ninetyDaysAgo = new Date(Date.now() - 90 * 86400000);

    const [totalCommunities, communitiesCreated30d, totalMembers, membersJoined30d, industryDist, membersCount] = await Promise.all([
      this.prisma.community.count({ where: { deletedAt: null, isActive: true } }),
      this.prisma.community.count({ where: { deletedAt: null, isActive: true, createdAt: { gte: thirtyDaysAgo } } }),
      this.prisma.communityMember.count({ where: { community: { deletedAt: null, isActive: true } } }),
      this.prisma.communityMember.count({ where: { joinedAt: { gte: thirtyDaysAgo }, community: { deletedAt: null, isActive: true } } }),
      this.prisma.industryRoom.groupBy({
        by: ['industryId'],
        where: { industryId: { not: null }, community: { deletedAt: null, isActive: true } },
        _count: { id: true },
        orderBy: { _count: { id: 'desc' } },
        take: 10,
      }),
      this.prisma.communityMember.groupBy({
        by: ['userId'],
        where: { community: { deletedAt: null, isActive: true } },
        _count: { communityId: true },
      }),
    ]);

    const avgCommunitiesPerUser = membersCount.length > 0
      ? Math.round((membersCount.reduce((s, m) => s + m._count.communityId, 0) / membersCount.length) * 10) / 10
      : 0;

    const industryIds = industryDist.filter(r => r.industryId).map(r => r.industryId!) as string[];
    const industries = industryIds.length
      ? await this.prisma.industry.findMany({ where: { id: { in: industryIds } }, select: { id: true, name: true } })
      : [];

    const engagementRate = totalMembers > 0 ? Math.round((membersJoined30d / totalMembers) * 100) : 0;
    const communityGrowth30d = (totalCommunities - communitiesCreated30d) > 0
      ? Math.round((communitiesCreated30d / (totalCommunities - communitiesCreated30d)) * 100)
      : 0;
    const memberGrowth30d = (totalMembers - membersJoined30d) > 0
      ? Math.round((membersJoined30d / (totalMembers - membersJoined30d)) * 100)
      : 0;

    const growthTrend: Array<{ month: string; communities: number; members: number }> = [];
    for (let i = 5; i >= 0; i--) {
      const monthStart = new Date(new Date().getFullYear(), new Date().getMonth() - i, 1);
      const monthEnd = new Date(new Date().getFullYear(), new Date().getMonth() - i + 1, 1);
      const monthKey = monthStart.toLocaleString('en-US', { month: 'short', year: 'numeric' });
      const [commsInMonth, memsInMonth] = await Promise.all([
        this.prisma.community.count({ where: { deletedAt: null, isActive: true, createdAt: { gte: monthStart, lt: monthEnd } } }),
        this.prisma.communityMember.count({ where: { joinedAt: { gte: monthStart, lt: monthEnd }, community: { deletedAt: null, isActive: true } } }),
      ]);
      growthTrend.push({ month: monthKey, communities: commsInMonth, members: memsInMonth });
    }

    const topIndustries = industryDist.slice(0, 5).map(r => ({
      name: industries.find(i => i.id === r.industryId)?.name || 'Unknown',
      communityCount: r._count.id,
      memberCount: 0,
      growth: 0,
    }));

    const lowActivityCommunities = await this.prisma.community.findMany({
      where: { deletedAt: null, isActive: true, createdAt: { lt: ninetyDaysAgo } },
      orderBy: { memberCount: 'asc' },
      take: 5,
      select: { id: true, name: true, memberCount: true, createdAt: true },
    });

    const inactiveCommunities = lowActivityCommunities
      .filter(c => c.memberCount <= 2)
      .map(c => ({
        id: c.id,
        name: c.name,
        memberCount: c.memberCount,
        daysSinceLastActivity: Math.floor((Date.now() - c.createdAt.getTime()) / 86400000),
        suggestedAction: c.memberCount === 0 ? 'Consider archiving' : 'Promote to attract more members',
      }));

    const recommendations: string[] = [];
    if (communitiesCreated30d === 0) recommendations.push('Encourage community creation through featured initiatives');
    if (engagementRate < 20) recommendations.push('Boost member engagement with targeted discussion prompts');
    if (avgCommunitiesPerUser < 2) recommendations.push('Encourage members to join multiple relevant communities');
    if (inactiveCommunities.length > 0) recommendations.push(`${inactiveCommunities.length} community(ies) may need revitalization`);

    return {
      totalCommunities, totalMembers, communityGrowth30d, memberGrowth30d,
      engagementRate, activeMemberRate: engagementRate,
      topIndustries, growthTrend, inactiveCommunities, recommendations,
    };
  }

  async getKnowledgeDiscovery(_companyId: string): Promise<KnowledgeDiscoveryResponse> {
    const [industries, communities, tradeServPros] = await Promise.all([
      this.prisma.industry.findMany({ orderBy: { name: 'asc' }, take: 10, select: { id: true, name: true } }),
      this.prisma.community.findMany({
        where: { deletedAt: null, isActive: true },
        orderBy: { memberCount: 'desc' },
        take: 10,
        select: { id: true, name: true, description: true, tags: true, memberCount: true, roomCount: true },
      }),
      this.prisma.company.findMany({
        where: { professionalType: { not: null }, professionalStatus: 'APPROVED' as any },
        orderBy: { trustScore: 'desc' },
        take: 10,
        select: { id: true, name: true, slug: true, professionalType: true, trustScore: true, description: true, professionalServices: { take: 3, select: { name: true } } },
      }).catch(gracefulCatch('communityAgent.getKnowledgeDiscovery.tradeServPros', [] as Array<{ id: string; name: string; slug: string; professionalType: string | null; trustScore: number | null; description: string | null; professionalServices: Array<{ name: string }> }>)),
    ]);

    const trendingDiscussions: Array<{ title: string; communityName: string; authorName: string; replyCount: number; createdAt: Date }> = [];
    for (const c of communities.slice(0, 5)) {
      trendingDiscussions.push({
        title: `${c.name} community insights`,
        communityName: c.name,
        authorName: 'Community',
        replyCount: c.roomCount,
        createdAt: new Date(),
      });
    }

    const industryUpdates = industries.slice(0, 5).map(ind => ({
      industry: ind.name,
      title: `${ind.name} Industry Update`,
      summary: `Latest trends and discussions in the ${ind.name} industry`,
      relevanceScore: 75,
    }));

    const businessResources = [
      { title: 'B2B Networking Best Practices', description: 'Guide to building meaningful business connections', type: 'Guide', url: '/tradetalk' },
      { title: 'Community Engagement Playbook', description: 'Strategies for active community participation', type: 'Playbook', url: '/tradetalk' },
    ];

    const professionalInsights = tradeServPros.slice(0, 5).map(p => ({
      professionalName: p.name,
      companyName: p.name,
      insight: p.description || `${p.professionalType} with ${p.professionalServices.length} service(s)`,
      trustScore: p.trustScore ?? 0,
    }));

    const recommendedExperts = tradeServPros.slice(0, 10).map(p => ({
      companyId: p.id,
      name: p.name,
      slug: p.slug,
      professionalType: p.professionalType || 'Professional',
      serviceCount: p.professionalServices.length,
      trustScore: p.trustScore ?? 0,
    }));

    return { trendingDiscussions, industryUpdates, businessResources, professionalInsights, recommendedExperts };
  }

  async getCollaborationAdvisor(companyId: string): Promise<CollaborationAdvisorResponse> {
    const [company, categories] = await Promise.all([
      this.prisma.company.findUnique({
        where: { id: companyId },
        select: { id: true, name: true, industries: { include: { industry: true } }, professionalServices: { select: { category: true } } },
      }),
      this.prisma.professionalService.groupBy({
        by: ['category'],
        where: { category: { not: null }, isActive: true },
        _count: { category: true },
        orderBy: { _count: { category: 'desc' } },
        take: 10,
      }),
    ]);

    const myIndustries = ((company as any)?.industries?.map((ci: any) => ci.industry?.name) || []) as string[];
    const myServiceCategories = ((company as any)?.professionalServices?.map((s: any) => s.category).filter(Boolean) || []) as string[];

    const partners = await this.prisma.company.findMany({
      where: {
        id: { not: companyId },
        OR: [
          myIndustries.length > 0 ? { industries: { some: { industry: { name: { in: myIndustries } } } } } : {},
          myServiceCategories.length > 0 ? { professionalServices: { some: { category: { in: myServiceCategories } } } } : {},
        ].filter(o => Object.keys(o).length > 0),
      },
      orderBy: { trustScore: 'desc' },
      take: 10,
      select: { id: true, name: true, trustScore: true, industries: { include: { industry: { select: { name: true } } }, take: 1 } },
    }).catch(gracefulCatch('communityAgent.getCollaborationAdvisor.partners', [] as Array<{ id: string; name: string; trustScore: number | null; industries: Array<{ industry: { name: string } }> }>));

    const potentialPartnerships = partners.map(p => ({
      companyId: p.id,
      name: p.name,
      trustScore: p.trustScore ?? 0,
      industry: (p.industries as any[])?.[0]?.industry?.name || '',
      opportunity: myServiceCategories.length > 0 ? 'Complementary services' : 'Industry alignment',
    }));

    const suppliers = await this.prisma.company.findMany({
      where: { id: { not: companyId }, totalProducts: { gt: 0 } },
      orderBy: { trustScore: 'desc' },
      take: 10,
      select: { id: true, name: true, trustScore: true, totalProducts: true },
    }).catch(gracefulCatch('communityAgent.getCollaborationAdvisor.suppliers', [] as Array<{ id: string; name: string; trustScore: number | null; totalProducts: number }>));

    const supplierConnections = suppliers.map(s => ({
      companyId: s.id,
      name: s.name,
      productCategories: [],
      trustScore: s.trustScore ?? 0,
    }));

    const buyers = await this.prisma.rfq.groupBy({
      by: ['companyId'],
      where: { deletedAt: null },
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
      take: 10,
    });
    const buyerIds = buyers.map(b => b.companyId);
    const buyerCompanies = buyerIds.length
      ? await this.prisma.company.findMany({ where: { id: { in: buyerIds } }, select: { id: true, name: true, trustScore: true } })
      : [];

    const buyerOpportunities = buyers.map(b => ({
      companyId: b.companyId,
      name: buyerCompanies.find(c => c.id === b.companyId)?.name || 'Unknown',
      recentRfqs: b._count.id,
      trustScore: buyerCompanies.find(c => c.id === b.companyId)?.trustScore ?? 0,
    }));

    const tradeservPros = await this.prisma.company.findMany({
      where: { professionalType: { not: null }, professionalStatus: 'APPROVED' as any, id: { not: companyId } },
      orderBy: { trustScore: 'desc' },
      take: 10,
      select: { id: true, name: true, professionalType: true, trustScore: true, _count: { select: { professionalServices: true } }, locations: { take: 1, select: { city: true } } },
    }).catch(gracefulCatch('communityAgent.getCollaborationAdvisor.tradeservPros', [] as Array<{ id: string; name: string; professionalType: string | null; trustScore: number | null; _count: { professionalServices: number }; locations: Array<{ city: string }> }>));

    const tradeservOpportunities = tradeservPros.map(p => ({
      companyId: p.id,
      name: p.name,
      professionalType: p.professionalType || 'Professional',
      serviceCount: p._count.professionalServices,
      location: (p.locations as any[])?.[0]?.city || '',
    }));

    const marketplaceOpportunities = categories.slice(0, 5).map(c => ({
      category: c.category || '',
      demandLevel: (c._count.category as number) > 10 ? 'high' : (c._count.category as number) > 3 ? 'medium' : 'low',
      professionalCount: c._count.category as number,
      potentialScore: Math.min(95, 100 - ((c._count.category as number) * 3)),
    }));

    return { potentialPartnerships, supplierConnections, buyerOpportunities, tradeservOpportunities, marketplaceOpportunities };
  }

  async getCommunityReputation(companyId: string, userId: string): Promise<CommunityReputationResponse> {
    const [myMemberships, trustScore, myCommunitiesLed] = await Promise.all([
      this.prisma.communityMember.findMany({
        where: { userId, status: 'ACTIVE' },
        select: { id: true, role: true, communityId: true },
        take: 50,
      }).catch(gracefulCatch('communityAgent.getCommunityReputation.myMemberships', [])),
      this.tradTrust.getScore(companyId).catch(gracefulCatch('communityAgent.getCommunityReputation.trustScore', null)),
      this.prisma.communityMember.count({
        where: { userId, role: { in: ['OWNER', 'ADMIN'] }, status: 'ACTIVE' },
      }).catch(gracefulCatch('communityAgent.getCommunityReputation.myCommunitiesLed', 0)),
    ]);

    const participationScore = Math.min(100, myMemberships.length * 15);
    const communitiesLed = myCommunitiesLed;
    const contributions = myMemberships.length;
    const ts = trustScore as any;
    const tradTrustScore = ts?.score ?? 0;
    const credibilityScore = Math.min(100, Math.round((tradTrustScore / 1000) * 100));
    const leadershipScore = Math.min(100, communitiesLed * 25);
    const overallScore = Math.round((participationScore + credibilityScore + leadershipScore) / 3);

    const grade = overallScore >= 90 ? 'A+' : overallScore >= 75 ? 'A' : overallScore >= 60 ? 'B' : overallScore >= 45 ? 'C' : 'D';
    const communitiesJoined = myMemberships.length;

    const breakdown = [
      { factor: 'Community Participation', score: participationScore, maxScore: 100, description: `Member of ${communitiesJoined} community(ies)` },
      { factor: 'Leadership', score: leadershipScore, maxScore: 100, description: `Leading ${communitiesLed} community(ies)` },
      { factor: 'Credibility', score: credibilityScore, maxScore: 100, description: 'Based on TradTrust score' },
    ];

    const improvements: string[] = [];
    if (communitiesJoined === 0) improvements.push('Join at least one community to establish your presence');
    if (communitiesLed === 0) improvements.push('Take on leadership roles in communities you join');
    if (tradTrustScore < 600) improvements.push('Improve your overall TradTrust score to boost credibility');

    return { participationScore, communitiesJoined, communitiesLed, contributions, credibilityScore, tradTrustScore, leadershipScore, overallGrade: grade, breakdown, improvements };
  }

  async getNotifications(companyId: string, userId: string): Promise<CommunityNotificationsResponse> {
    const user = await this.prisma.user.findUnique({ where: { id: userId }, select: { email: true } }).catch(gracefulCatch('communityAgent.getNotifications.user', null));
    const [communities, invitations, trendingIndustries] = await Promise.all([
      this.prisma.communityMember.findMany({
        where: { userId, status: 'ACTIVE' },
        include: { community: { select: { id: true, name: true, slug: true, memberCount: true } } },
        take: 50,
      }).catch(gracefulCatch('communityAgent.getNotifications.communities', [] as Array<{ community: { id: string; name: string; slug: string; memberCount: number } }>)),
      user?.email
        ? this.prisma.communityInvitation.findMany({ where: { email: user.email, status: 'PENDING', expiresAt: { gte: new Date() } }, orderBy: { createdAt: 'desc' }, take: 5 })
        : Promise.resolve([]),
      this.tradeTalk.getCommunityInsights().catch(gracefulCatch('communityAgent.getNotifications.trendingIndustries', null)),
    ]);

    const invitationAlerts: TradeAgentNotificationItem[] = invitations.map(inv => ({
      type: 'alert',
      title: 'Community Invitation',
      body: `You've been invited to join a community`,
      priority: 'medium',
      link: '/tradetalk/invitations',
      createdAt: inv.createdAt,
    }));

    const trendingItems: TradeAgentNotificationItem[] = [];
    if (trendingIndustries) {
      const ti = trendingIndustries as any;
      const topIndustries = ti?.industryDistribution?.slice(0, 3) || [];
      for (const ind of topIndustries) {
        trendingItems.push({
          type: 'insight',
          title: `Trending: ${ind.industryName || 'Industry'}`,
          body: `${ind.count} community(ies) active in this space`,
          priority: 'low',
          link: '/tradetalk/communities',
          createdAt: new Date(),
        });
      }
    }

    const collaborationItems: TradeAgentNotificationItem[] = [];
    if (communities.length > 0) {
      collaborationItems.push({
        type: 'opportunity',
        title: 'Network with Communities',
        body: `You're a member of ${communities.length} community(ies) — explore new connections`,
        priority: 'low',
        link: '/tradetalk/my',
        createdAt: new Date(),
      });
    }

    const dailyDigest = `${invitations.length} pending invitation(s), ${communities.length} communities joined, ${(trendingIndustries as any)?.totalCommunities || 0} total platform communities`;

    return {
      dailyDigest,
      trendingIndustries: trendingItems,
      invitationAlerts,
      discussionHighlights: [],
      collaborationOpportunities: collaborationItems,
    };
  }

  async getAnalytics(): Promise<CommunityAnalyticsResponse> {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000);
    const now = new Date();
    const period = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    const [totalCommunities, communities30dAgo, totalMembers, members30dAgo, membersCount, industryDist] = await Promise.all([
      this.prisma.community.count({ where: { deletedAt: null, isActive: true } }),
      this.prisma.community.count({ where: { createdAt: { lt: thirtyDaysAgo }, deletedAt: null, isActive: true } }),
      this.prisma.communityMember.count({ where: { community: { deletedAt: null, isActive: true } } }),
      this.prisma.communityMember.count({ where: { joinedAt: { lt: thirtyDaysAgo }, community: { deletedAt: null, isActive: true } } }),
      this.prisma.communityMember.groupBy({
        by: ['userId'],
        where: { community: { deletedAt: null, isActive: true } },
        _count: { communityId: true },
      }),
      this.prisma.industryRoom.groupBy({
        by: ['industryId'],
        where: { industryId: { not: null }, community: { deletedAt: null, isActive: true } },
        _count: { id: true },
        orderBy: { _count: { id: 'desc' } },
        take: 5,
      }),
    ]);

    const communityGrowth30d = communities30dAgo > 0 ? Math.round(((totalCommunities - communities30dAgo) / communities30dAgo) * 100) : 0;
    const memberGrowth30d = members30dAgo > 0 ? Math.round(((totalMembers - members30dAgo) / members30dAgo) * 100) : 0;
    const avgCommunitiesPerUser = membersCount.length > 0 ? Math.round((membersCount.reduce((s, m) => s + m._count.communityId, 0) / membersCount.length) * 10) / 10 : 0;

    const industryIds = industryDist.filter(r => r.industryId).map(r => r.industryId!) as string[];
    const industries = industryIds.length ? await this.prisma.industry.findMany({ where: { id: { in: industryIds } }, select: { id: true, name: true } }) : [];

    return {
      period,
      communityGrowth: { total: totalCommunities, growth30d: communityGrowth30d, newThisMonth: 0 },
      memberEngagement: { total: totalMembers, active30d: 0, engagementRate: memberGrowth30d, avgCommunitiesPerUser },
      recommendationAdoption: { totalRecommendations: 0, acceptedRecommendations: 0, adoptionRate: 0 },
      aiAdoption: { totalAiCalls: 0, uniqueUsers: 0 },
      networkingSuccess: { totalConnections: 0, collaborationRate: 0 },
      knowledgeContribution: { totalDiscussions: 0, activeContributors: 0, contributionRate: 0 },
      topIndustries: industryDist.map(r => ({
        name: industries.find(i => i.id === r.industryId)?.name || 'Unknown',
        communityCount: r._count.id,
        memberCount: 0,
        growth: 0,
      })),
    };
  }

  async getAllInsights(companyId: string, userId: string): Promise<CommunityAgentInsightsResponse> {
    const [dashboardCopilot, networkingAdvisor, communityIntelligence, knowledgeDiscovery, collaborationAdvisor, communityReputation, notifications, analytics] = await Promise.all([
      this.getDashboardCopilot(companyId, userId),
      this.getNetworkingAdvisor(companyId, userId),
      this.getCommunityIntelligence(companyId),
      this.getKnowledgeDiscovery(companyId),
      this.getCollaborationAdvisor(companyId),
      this.getCommunityReputation(companyId, userId),
      this.getNotifications(companyId, userId),
      this.getAnalytics(),
    ]);
    return { dashboardCopilot, networkingAdvisor, communityIntelligence, knowledgeDiscovery, collaborationAdvisor, communityReputation, notifications, analytics };
  }
}
