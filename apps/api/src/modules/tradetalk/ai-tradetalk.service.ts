import { Injectable, Logger } from '@nestjs/common';
import { AiGatewayService } from '../ai-gateway/ai-gateway.service';
import { PromptManagerService } from '../ai-gateway/prompt-manager.service';
import { TaskType } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AiTradeTalkService {
  private readonly logger = new Logger(AiTradeTalkService.name);

  constructor(
    private readonly aiGateway: AiGatewayService,
    private readonly prompts: PromptManagerService,
    private readonly prisma: PrismaService,
  ) {}

  async onModuleInit() {
    try {
      await this.prompts.getPrompt(TaskType.COMMUNITY_ANALYSIS);
    } catch {
      await this.prompts.createPrompt({
        taskType: TaskType.COMMUNITY_ANALYSIS,
        name: 'AI Community Copilot & Intelligence',
        description: 'Default prompt for TradeTalk AI Community Copilot',
        systemPrompt: `You are TRADINGO's AI Community Intelligence Assistant. You analyze business communities and provide actionable insights, recommendations, content assistance, moderation, and networking suggestions. Your responses must be concise, data-driven, and focused on business value. Always reference specific data points when available. Format responses in clear sections with brief bullet points. For content generation, produce professional B2B content optimized for the TRADINGO marketplace. For moderation, flag policy violations with specific reasons.`,
        userPrompt: `Action: {{action}}\n\nContext:\n{{context}}\n\nProvide a clear, actionable response based on the context above. Focus on business value and specific data points.`,
        variables: ['action', 'context'],
        temperature: 0.3,
        maxTokens: 2048,
      });
      this.logger.log('Seeded default COMMUNITY_ANALYSIS prompt');
    }
  }

  private async enrichCommunityContext(communityId: string): Promise<Record<string, unknown>> {
    const community = await this.prisma.community.findFirst({
      where: { OR: [{ id: communityId }, { slug: communityId }], deletedAt: null },
      include: {
        category: true,
        _count: { select: { members: true, rooms: true } },
        rooms: { where: { isActive: true }, take: 5, orderBy: { memberCount: 'desc' } },
      },
    });
    if (!community) return {};
    return {
      communityId: community.id,
      name: community.name,
      description: community.description || '',
      category: community.category?.name || '',
      visibility: community.visibility,
      joinSetting: community.joinSetting,
      tags: community.tags,
      memberCount: community.memberCount,
      roomCount: community.roomCount,
      isFeatured: community.isFeatured,
      createdAt: community.createdAt.toISOString(),
      topRooms: community.rooms.map((r) => ({ name: r.name, members: r.memberCount, industry: r.industryId })),
    };
  }

  private async enrichUserContext(userId: string): Promise<Record<string, unknown>> {
    const [user, owner] = await Promise.all([
      this.prisma.user.findUnique({ where: { id: userId }, select: { id: true, name: true, email: true } }),
      this.prisma.companyOwner.findFirst({
        where: { userId },
        include: { company: { include: { industries: { include: { industry: true } }, locations: { take: 1, where: { isPrimary: true } } } } },
      }),
    ]);
    const company = owner?.company;
    return {
      userName: user?.name || '',
      userEmail: user?.email || '',
      companyName: company?.name || '',
      companyTrustScore: company?.trustScore || 0,
      companyIndustries: company?.industries.map((ci) => ci.industry.name) || [],
      companyLocation: company?.locations[0] ? `${company.locations[0].city}, ${company.locations[0].state}` : '',
      verificationLevel: company?.verificationLevel || 'LEVEL_0',
    };
  }

  async aiCommunityCopilot(companyId: string, userId: string, payload: { communityId?: string; action?: string }) {
    const context: Record<string, unknown> = {};
    if (payload.communityId) context.community = await this.enrichCommunityContext(payload.communityId);
    context.user = await this.enrichUserContext(userId);
    if (payload.action) context.requestedAction = payload.action;

    return this.aiGateway.process({
      taskType: TaskType.COMMUNITY_ANALYSIS,
      payload: { action: 'community_copilot', context },
    }, companyId, userId);
  }

  async aiCommunitySummary(companyId: string, userId: string, payload: { communityId: string }) {
    const context = await this.enrichCommunityContext(payload.communityId);
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const [recentMembers, totalMembers] = await Promise.all([
      this.prisma.communityMember.count({ where: { communityId: context.communityId as string || payload.communityId, joinedAt: { gte: thirtyDaysAgo } } }),
      this.prisma.communityMember.count({ where: { communityId: context.communityId as string || payload.communityId, status: 'ACTIVE' } }),
    ]);
    context.recentMemberGrowth = recentMembers;
    context.totalMembers = totalMembers;

    return this.aiGateway.process({
      taskType: TaskType.COMMUNITY_ANALYSIS,
      payload: { action: 'community_summary', context },
    }, companyId, userId);
  }

  async aiSuggestedCommunities(companyId: string, userId: string, payload: { limit?: number; industry?: string; location?: string }) {
    const userContext = await this.enrichUserContext(userId);
    const context: Record<string, unknown> = { user: userContext, limit: payload.limit || 5 };
    if (payload.industry) context.industry = payload.industry;
    if (payload.location) context.location = payload.location;

    const industryIds = await this.prisma.companyIndustry.findMany({
      where: { company: { owners: { some: { userId } } } },
      include: { industry: true },
      take: 5,
    });
    context.companyIndustries = industryIds.map((ci) => ci.industry.name);

    return this.aiGateway.process({
      taskType: TaskType.COMMUNITY_ANALYSIS,
      payload: { action: 'suggested_communities', context },
    }, companyId, userId);
  }

  async aiSuggestedMembers(companyId: string, userId: string, payload: { communityId?: string; limit?: number; expertise?: string }) {
    const context: Record<string, unknown> = { user: await this.enrichUserContext(userId), limit: payload.limit || 5 };
    if (payload.communityId) context.community = await this.enrichCommunityContext(payload.communityId);
    if (payload.expertise) context.expertise = payload.expertise;

    const memberProfiles = await this.prisma.communityMember.findMany({
      where: payload.communityId ? { communityId: payload.communityId, status: 'ACTIVE' } : { userId: { not: userId }, status: 'ACTIVE' },
      include: { user: { select: { id: true, name: true } } },
      take: 10,
      orderBy: { joinedAt: 'desc' },
    });
    context.recentMembers = memberProfiles.map((m) => ({ name: m.user.name, role: m.role }));

    return this.aiGateway.process({
      taskType: TaskType.COMMUNITY_ANALYSIS,
      payload: { action: 'suggested_members', context },
    }, companyId, userId);
  }

  async aiNetworkingSuggestions(companyId: string, userId: string, payload: { communityId: string; limit?: number }) {
    const context: Record<string, unknown> = { user: await this.enrichUserContext(userId), limit: payload.limit || 5 };
    context.community = await this.enrichCommunityContext(payload.communityId);

    const leaders = await this.prisma.communityMember.findMany({
      where: { communityId: payload.communityId, status: 'ACTIVE', role: { in: ['OWNER', 'ADMIN'] } },
      include: { user: { select: { id: true, name: true } } },
      take: 10,
    });
    context.communityLeaders = leaders.map((l) => ({ name: l.user.name, role: l.role }));

    return this.aiGateway.process({
      taskType: TaskType.COMMUNITY_ANALYSIS,
      payload: { action: 'networking_suggestions', context },
    }, companyId, userId);
  }

  async aiDiscussionIdeas(companyId: string, userId: string, payload: { communityId: string; limit?: number }) {
    const context = await this.enrichCommunityContext(payload.communityId);
    context.limit = payload.limit || 5;
    context.userContext = await this.enrichUserContext(userId);

    return this.aiGateway.process({
      taskType: TaskType.COMMUNITY_ANALYSIS,
      payload: { action: 'discussion_ideas', context },
    }, companyId, userId);
  }

  async aiCommunityInsights(companyId: string, userId: string, payload: { communityId?: string; period?: string }) {
    const context: Record<string, unknown> = { period: payload.period || '30d' };
    if (payload.communityId) context.community = await this.enrichCommunityContext(payload.communityId);
    context.user = await this.enrichUserContext(userId);

    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const [totalCommunities, totalMembers, communitiesCreated30d, membersJoined30d, pendingInvites] = await Promise.all([
      this.prisma.community.count({ where: { deletedAt: null, isActive: true } }),
      this.prisma.communityMember.count({ where: { status: 'ACTIVE' } }),
      this.prisma.community.count({ where: { deletedAt: null, isActive: true, createdAt: { gte: thirtyDaysAgo } } }),
      this.prisma.communityMember.count({ where: { status: 'ACTIVE', joinedAt: { gte: thirtyDaysAgo } } }),
      this.prisma.communityInvitation.count({ where: { status: 'PENDING' } }),
    ]);
    context.platformStats = { totalCommunities, totalMembers, communitiesCreated30d, membersJoined30d, pendingInvites };

    return this.aiGateway.process({
      taskType: TaskType.COMMUNITY_ANALYSIS,
      payload: { action: 'community_insights', context },
    }, companyId, userId);
  }

  async aiDashboardWidgets(companyId: string, userId: string, payload: { limit?: number }) {
    const context: Record<string, unknown> = { user: await this.enrichUserContext(userId), limit: payload.limit || 5 };

    const [myCommunities, allCommunities, invitations] = await Promise.all([
      this.prisma.communityMember.findMany({
        where: { userId, status: 'ACTIVE' },
        include: { community: { select: { id: true, name: true, slug: true, memberCount: true } } },
        take: 5,
      }),
      this.prisma.community.findMany({
        where: { deletedAt: null, isActive: true },
        orderBy: { memberCount: 'desc' },
        take: 5,
        select: { id: true, name: true, slug: true, memberCount: true, isFeatured: true },
      }),
      this.prisma.communityInvitation.count({
        where: { email: (await this.prisma.user.findUnique({ where: { id: userId }, select: { email: true } }))?.email || '', status: 'PENDING' },
      }),
    ]);
    context.myCommunities = myCommunities.map((m) => ({ name: m.community.name, slug: m.community.slug, memberCount: m.community.memberCount }));
    context.popularCommunities = allCommunities.map((c) => ({ name: c.name, slug: c.slug, memberCount: c.memberCount, isFeatured: c.isFeatured }));
    context.pendingInvitations = invitations;

    return this.aiGateway.process({
      taskType: TaskType.COMMUNITY_ANALYSIS,
      payload: { action: 'dashboard_widgets', context },
    }, companyId, userId);
  }

  async aiNotificationPrep(companyId: string, userId: string, payload: { communityId?: string }) {
    const context: Record<string, unknown> = {};
    if (payload.communityId) context.community = await this.enrichCommunityContext(payload.communityId);
    context.user = await this.enrichUserContext(userId);

    return this.aiGateway.process({
      taskType: TaskType.COMMUNITY_ANALYSIS,
      payload: { action: 'notification_prep', context },
    }, companyId, userId);
  }

  // ── Phase D7: Content Assistance ──

  async generatePost(companyId: string, userId: string, payload: { topic: string; tone?: string; audience?: string; keywords?: string }) {
    return this.aiGateway.process({
      taskType: TaskType.COMMUNITY_ANALYSIS,
      payload: { action: 'generate_post', context: { ...payload, user: await this.enrichUserContext(userId) } },
    }, companyId, userId);
  }

  async rewritePost(companyId: string, userId: string, payload: { content: string; style?: string; audience?: string }) {
    return this.aiGateway.process({
      taskType: TaskType.COMMUNITY_ANALYSIS,
      payload: { action: 'rewrite_post', context: { ...payload } },
    }, companyId, userId);
  }

  async improveGrammar(companyId: string, userId: string, payload: { content: string }) {
    return this.aiGateway.process({
      taskType: TaskType.COMMUNITY_ANALYSIS,
      payload: { action: 'improve_grammar', context: { ...payload } },
    }, companyId, userId);
  }

  async summarizeContent(companyId: string, userId: string, payload: { content: string; maxLength?: number }) {
    return this.aiGateway.process({
      taskType: TaskType.COMMUNITY_ANALYSIS,
      payload: { action: 'summarize_content', context: { ...payload } },
    }, companyId, userId);
  }

  async translateContent(companyId: string, userId: string, payload: { content: string; targetLanguage: string; sourceLanguage?: string }) {
    return this.aiGateway.process({
      taskType: TaskType.COMMUNITY_ANALYSIS,
      payload: { action: 'translate_content', context: { ...payload } },
    }, companyId, userId);
  }

  async suggestHashtags(companyId: string, userId: string, payload: { content: string; maxCount?: number }) {
    return this.aiGateway.process({
      taskType: TaskType.COMMUNITY_ANALYSIS,
      payload: { action: 'suggest_hashtags', context: { ...payload } },
    }, companyId, userId);
  }

  async suggestTitle(companyId: string, userId: string, payload: { content: string }) {
    return this.aiGateway.process({
      taskType: TaskType.COMMUNITY_ANALYSIS,
      payload: { action: 'suggest_title', context: { ...payload } },
    }, companyId, userId);
  }

  // ── Phase D7: Moderation ──

  async detectSpam(companyId: string, userId: string, payload: { content: string; communityId?: string }) {
    const userContext = await this.enrichUserContext(userId);
    const context: Record<string, unknown> = { content: payload.content, user: userContext };
    if (payload.communityId) context.community = await this.enrichCommunityContext(payload.communityId);

    const recentPosts = await this.prisma.socialPost.findMany({
      where: { authorId: userId, createdAt: { gte: new Date(Date.now() - 3600000) } },
      select: { id: true },
      take: 20,
    });
    context.recentPostCount = recentPosts.length;

    return this.aiGateway.process({
      taskType: TaskType.COMMUNITY_ANALYSIS,
      payload: { action: 'detect_spam', context },
    }, companyId, userId);
  }

  async detectDuplicateContent(companyId: string, userId: string, payload: { content: string; communityId?: string }) {
    const context: Record<string, unknown> = { content: payload.content };

    const similarPosts = await this.prisma.socialPost.findMany({
      where: payload.communityId ? { communityId: payload.communityId } : {},
      select: { id: true, content: true, authorId: true },
      take: 10,
      orderBy: { createdAt: 'desc' },
    });
    context.recentPosts = similarPosts.map((p) => ({ id: p.id, content: p.content?.substring(0, 200), authorId: p.authorId }));

    return this.aiGateway.process({
      taskType: TaskType.COMMUNITY_ANALYSIS,
      payload: { action: 'detect_duplicates', context },
    }, companyId, userId);
  }

  async detectOffensiveLanguage(companyId: string, userId: string, payload: { content: string }) {
    return this.aiGateway.process({
      taskType: TaskType.COMMUNITY_ANALYSIS,
      payload: { action: 'detect_offensive', context: { content: payload.content } },
    }, companyId, userId);
  }

  async detectUnsafeLinks(companyId: string, userId: string, payload: { content: string; linkUrl?: string }) {
    return this.aiGateway.process({
      taskType: TaskType.COMMUNITY_ANALYSIS,
      payload: { action: 'detect_unsafe_links', context: { content: payload.content, linkUrl: payload.linkUrl || '' } },
    }, companyId, userId);
  }

  async recommendContentStatus(companyId: string, userId: string, payload: { content: string; communityId?: string }) {
    const userContext = await this.enrichUserContext(userId);
    const context: Record<string, unknown> = { content: payload.content, user: userContext };
    if (payload.communityId) context.community = await this.enrichCommunityContext(payload.communityId);

    return this.aiGateway.process({
      taskType: TaskType.COMMUNITY_ANALYSIS,
      payload: { action: 'recommend_status', context },
    }, companyId, userId);
  }

  // ── Phase D7: Insights ──

  async suggestPostingTime(companyId: string, userId: string, payload: { communityId?: string }) {
    const context: Record<string, unknown> = { user: await this.enrichUserContext(userId) };
    if (payload.communityId) context.community = await this.enrichCommunityContext(payload.communityId);

    const recentPosts = await this.prisma.socialPost.findMany({
      where: { authorId: userId },
      select: { createdAt: true, likeCount: true, commentCount: true },
      take: 50,
      orderBy: { createdAt: 'desc' },
    });
    context.postingHistory = recentPosts.map((p) => ({
      hour: p.createdAt.getHours(),
      day: p.createdAt.getDay(),
      score: p.likeCount + p.commentCount,
    }));

    return this.aiGateway.process({
      taskType: TaskType.COMMUNITY_ANALYSIS,
      payload: { action: 'suggest_posting_time', context },
    }, companyId, userId);
  }

  async suggestCategories(companyId: string, userId: string, payload: { content: string }) {
    const categories = await this.prisma.communityCategory.findMany({
      where: { isActive: true },
      select: { id: true, name: true, description: true },
      take: 20,
    });
    return this.aiGateway.process({
      taskType: TaskType.COMMUNITY_ANALYSIS,
      payload: { action: 'suggest_categories', context: { content: payload.content, availableCategories: categories } },
    }, companyId, userId);
  }

  async suggestCommunitiesForContent(companyId: string, userId: string, payload: { content: string; excludeIds?: string[] }) {
    const communities = await this.prisma.community.findMany({
      where: { deletedAt: null, isActive: true },
      select: { id: true, name: true, description: true, memberCount: true, tags: true },
      orderBy: { memberCount: 'desc' },
      take: 20,
    });
    return this.aiGateway.process({
      taskType: TaskType.COMMUNITY_ANALYSIS,
      payload: { action: 'suggest_communities', context: { content: payload.content, availableCommunities: communities, excludeIds: payload.excludeIds || [] } },
    }, companyId, userId);
  }
}
