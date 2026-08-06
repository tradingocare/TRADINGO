import { Controller, Post, Body, UseGuards, Req, Request } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { Throttle } from '@nestjs/throttler';
import { AiTradeTalkService } from './ai-tradetalk.service';

interface RequestWithUser extends Request {
  user: { id: string; companyId?: string; email?: string; roles?: string[] };
}
import {
  GeneratePostDto, RewritePostDto, ContentDto, SummarizeContentDto,
  TranslateContentDto, SuggestHashtagsDto, SuggestTitleDto,
  DetectSpamDto, DetectDuplicateContentDto, DetectOffensiveDto,
  DetectUnsafeLinksDto, RecommendContentStatusDto,
  SuggestPostingTimeDto, SuggestCategoriesDto, SuggestCommunitiesForContentDto,
} from './dto/tradetalk-ai.dto';

@ApiTags('TradeTalk AI')
@Controller('tradetalk/ai')
@UseGuards(AuthGuard('jwt'))
@Throttle({ default: { limit: 20, ttl: 60000 } })
export class AiTradeTalkController {
  constructor(private readonly aiTradeTalkService: AiTradeTalkService) {}

  // ── Existing endpoints ──

  @Post('copilot')
  @ApiOperation({ summary: 'Get AI community copilot' })
  async communityCopilot( @Req() req: RequestWithUser, @Body() dto: { communityId?: string; action?: string }) {
    return this.aiTradeTalkService.aiCommunityCopilot(req.user?.companyId || req.user.id, req.user.id, dto);
  }

  @Post('summary')
  @ApiOperation({ summary: 'Get AI community summary' })
  async communitySummary( @Req() req: RequestWithUser, @Body() dto: { communityId: string }) {
    return this.aiTradeTalkService.aiCommunitySummary(req.user?.companyId || req.user.id, req.user.id, dto);
  }

  @Post('suggested-communities')
  @ApiOperation({ summary: 'Get suggested communities' })
  async suggestedCommunities( @Req() req: RequestWithUser, @Body() dto: { limit?: number; industry?: string; location?: string }) {
    return this.aiTradeTalkService.aiSuggestedCommunities(req.user?.companyId || req.user.id, req.user.id, dto);
  }

  @Post('suggested-members')
  @ApiOperation({ summary: 'Get suggested members' })
  async suggestedMembers( @Req() req: RequestWithUser, @Body() dto: { communityId?: string; limit?: number; expertise?: string }) {
    return this.aiTradeTalkService.aiSuggestedMembers(req.user?.companyId || req.user.id, req.user.id, dto);
  }

  @Post('networking-suggestions')
  @ApiOperation({ summary: 'Get networking suggestions' })
  async networkingSuggestions( @Req() req: RequestWithUser, @Body() dto: { communityId: string; limit?: number }) {
    return this.aiTradeTalkService.aiNetworkingSuggestions(req.user?.companyId || req.user.id, req.user.id, dto);
  }

  @Post('discussion-ideas')
  @ApiOperation({ summary: 'Get discussion ideas' })
  async discussionIdeas( @Req() req: RequestWithUser, @Body() dto: { communityId: string; limit?: number }) {
    return this.aiTradeTalkService.aiDiscussionIdeas(req.user?.companyId || req.user.id, req.user.id, dto);
  }

  @Post('insights')
  @ApiOperation({ summary: 'Get community insights' })
  async communityInsights( @Req() req: RequestWithUser, @Body() dto: { communityId?: string; period?: string }) {
    return this.aiTradeTalkService.aiCommunityInsights(req.user?.companyId || req.user.id, req.user.id, dto);
  }

  @Post('dashboard')
  @ApiOperation({ summary: 'Get AI dashboard widgets' })
  async dashboardWidgets( @Req() req: RequestWithUser, @Body() dto: { limit?: number }) {
    return this.aiTradeTalkService.aiDashboardWidgets(req.user?.companyId || req.user.id, req.user.id, dto);
  }

  @Post('notification-prep')
  @ApiOperation({ summary: 'Prepare AI notifications' })
  async notificationPrep( @Req() req: RequestWithUser, @Body() dto: { communityId?: string }) {
    return this.aiTradeTalkService.aiNotificationPrep(req.user?.companyId || req.user.id, req.user.id, dto);
  }

  // ── Phase D7: Content Assistance ──

  @Post('generate-post')
  @ApiOperation({ summary: 'Generate a business post using AI' })
  async generatePost( @Req() req: RequestWithUser, @Body() dto: GeneratePostDto) {
    return this.aiTradeTalkService.generatePost(req.user?.companyId || req.user.id, req.user.id, dto);
  }

  @Post('rewrite-post')
  @ApiOperation({ summary: 'Rewrite a post in a different style' })
  async rewritePost( @Req() req: RequestWithUser, @Body() dto: RewritePostDto) {
    return this.aiTradeTalkService.rewritePost(req.user?.companyId || req.user.id, req.user.id, dto);
  }

  @Post('improve-grammar')
  @ApiOperation({ summary: 'Improve grammar and clarity of post content' })
  async improveGrammar( @Req() req: RequestWithUser, @Body() dto: ContentDto) {
    return this.aiTradeTalkService.improveGrammar(req.user?.companyId || req.user.id, req.user.id, dto);
  }

  @Post('summarize')
  @ApiOperation({ summary: 'Summarize long content' })
  async summarizeContent( @Req() req: RequestWithUser, @Body() dto: SummarizeContentDto) {
    return this.aiTradeTalkService.summarizeContent(req.user?.companyId || req.user.id, req.user.id, dto);
  }

  @Post('translate')
  @ApiOperation({ summary: 'Translate post content to target language' })
  async translateContent( @Req() req: RequestWithUser, @Body() dto: TranslateContentDto) {
    return this.aiTradeTalkService.translateContent(req.user?.companyId || req.user.id, req.user.id, dto);
  }

  @Post('suggest-hashtags')
  @ApiOperation({ summary: 'Suggest hashtags for post content' })
  async suggestHashtags( @Req() req: RequestWithUser, @Body() dto: SuggestHashtagsDto) {
    return this.aiTradeTalkService.suggestHashtags(req.user?.companyId || req.user.id, req.user.id, dto);
  }

  @Post('suggest-title')
  @ApiOperation({ summary: 'Suggest a title for post content' })
  async suggestTitle( @Req() req: RequestWithUser, @Body() dto: SuggestTitleDto) {
    return this.aiTradeTalkService.suggestTitle(req.user?.companyId || req.user.id, req.user.id, dto);
  }

  // ── Phase D7: Moderation ──

  @Post('detect-spam')
  @ApiOperation({ summary: 'Detect spam content' })
  async detectSpam( @Req() req: RequestWithUser, @Body() dto: DetectSpamDto) {
    return this.aiTradeTalkService.detectSpam(req.user?.companyId || req.user.id, req.user.id, dto);
  }

  @Post('detect-duplicates')
  @ApiOperation({ summary: 'Detect duplicate content' })
  async detectDuplicateContent( @Req() req: RequestWithUser, @Body() dto: DetectDuplicateContentDto) {
    return this.aiTradeTalkService.detectDuplicateContent(req.user?.companyId || req.user.id, req.user.id, dto);
  }

  @Post('detect-offensive')
  @ApiOperation({ summary: 'Detect offensive language' })
  async detectOffensiveLanguage( @Req() req: RequestWithUser, @Body() dto: DetectOffensiveDto) {
    return this.aiTradeTalkService.detectOffensiveLanguage(req.user?.companyId || req.user.id, req.user.id, dto);
  }

  @Post('detect-unsafe-links')
  @ApiOperation({ summary: 'Detect unsafe links in content' })
  async detectUnsafeLinks( @Req() req: RequestWithUser, @Body() dto: DetectUnsafeLinksDto) {
    return this.aiTradeTalkService.detectUnsafeLinks(req.user?.companyId || req.user.id, req.user.id, dto);
  }

  @Post('recommend-status')
  @ApiOperation({ summary: 'Recommend content status based on policy review' })
  async recommendContentStatus( @Req() req: RequestWithUser, @Body() dto: RecommendContentStatusDto) {
    return this.aiTradeTalkService.recommendContentStatus(req.user?.companyId || req.user.id, req.user.id, dto);
  }

  // ── Phase D7: Insights ──

  @Post('suggest-posting-time')
  @ApiOperation({ summary: 'Suggest optimal posting time' })
  async suggestPostingTime( @Req() req: RequestWithUser, @Body() dto: SuggestPostingTimeDto) {
    return this.aiTradeTalkService.suggestPostingTime(req.user?.companyId || req.user.id, req.user.id, dto);
  }

  @Post('suggest-categories')
  @ApiOperation({ summary: 'Suggest categories for content' })
  async suggestCategories( @Req() req: RequestWithUser, @Body() dto: SuggestCategoriesDto) {
    return this.aiTradeTalkService.suggestCategories(req.user?.companyId || req.user.id, req.user.id, dto);
  }

  @Post('suggest-communities-for-content')
  @ApiOperation({ summary: 'Suggest communities where content fits best' })
  async suggestCommunitiesForContent( @Req() req: RequestWithUser, @Body() dto: SuggestCommunitiesForContentDto) {
    return this.aiTradeTalkService.suggestCommunitiesForContent(req.user?.companyId || req.user.id, req.user.id, dto);
  }
}
