import { Controller, Post, Get, Body, UseGuards, Query } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Throttle } from '@nestjs/throttler';
import { AiTradeservService } from './ai-tradeserv.service';
import {
  AiTradeservProfileReviewDto,
  AiTradeservBioDto,
  AiTradeservSeoDto,
  AiTradeservPortfolioSuggestionsDto,
  AiTradeservServiceDescriptionDto,
  AiTradeservProposalDto,
  AiTradeservPricingDto,
  AiTradeservSkillsDto,
  AiTradeservCategoriesDto,
  AiTradeservLeadReplyDto,
  AiTradeservMarketInsightsDto,
  AiTradeservCompetitorAnalysisDto,
  AiTradeservRecommendationsQueryDto,
} from './dto';

@ApiTags('TradeServ AI')
@UseGuards(JwtAuthGuard)
@Throttle({ default: { limit: 30, ttl: 60000 } })
@Controller('tradeserv/ai')
export class AiTradeservController {
  constructor(private readonly aiTradeserv: AiTradeservService) {}

  @Post('profile-review')
  @ApiOperation({ summary: 'AI profile review' })
  async profileReview(@CurrentUser() user: any, @Body() body: AiTradeservProfileReviewDto) {
    return this.aiTradeserv.writeProfile(user.companyId, user.id, body);
  }

  @Post('bio')
  @ApiOperation({ summary: 'AI bio generation' })
  async generateBio(@CurrentUser() user: any, @Body() body: AiTradeservBioDto) {
    return this.aiTradeserv.writeBio(user.companyId, user.id, body);
  }

  @Post('seo')
  @ApiOperation({ summary: 'AI SEO generation for professional profile' })
  async generateSeo(@CurrentUser() user: any, @Body() body: AiTradeservSeoDto) {
    return this.aiTradeserv.generateSeo(user.companyId, user.id, body);
  }

  @Post('portfolio-suggestions')
  @ApiOperation({ summary: 'AI portfolio review and suggestions' })
  async portfolioSuggestions(@CurrentUser() user: any, @Body() body: AiTradeservPortfolioSuggestionsDto) {
    return this.aiTradeserv.reviewPortfolio(user.companyId, user.id, body);
  }

  @Post('service-description')
  @ApiOperation({ summary: 'AI service description writer' })
  async serviceDescription(@CurrentUser() user: any, @Body() body: AiTradeservServiceDescriptionDto) {
    return this.aiTradeserv.writeProposal(user.companyId, user.id, body);
  }

  @Post('proposal')
  @ApiOperation({ summary: 'AI proposal writer' })
  async proposalWriter(@CurrentUser() user: any, @Body() body: AiTradeservProposalDto) {
    return this.aiTradeserv.writeProposal(user.companyId, user.id, body);
  }

  @Post('pricing')
  @ApiOperation({ summary: 'AI pricing suggestions' })
  async pricingSuggestions(@CurrentUser() user: any, @Body() body: AiTradeservPricingDto) {
    return this.aiTradeserv.suggestPricing(user.companyId, user.id, body);
  }

  @Post('skills')
  @ApiOperation({ summary: 'AI skill suggestions' })
  async skillSuggestions(@CurrentUser() user: any, @Body() body: AiTradeservSkillsDto) {
    return this.aiTradeserv.suggestSkills(user.companyId, user.id, body);
  }

  @Post('categories')
  @ApiOperation({ summary: 'AI category suggestions' })
  async categorySuggestions(@CurrentUser() user: any, @Body() body: AiTradeservCategoriesDto) {
    return this.aiTradeserv.suggestCategories(user.companyId, user.id, body);
  }

  @Post('lead-reply')
  @ApiOperation({ summary: 'AI lead reply suggestion' })
  async leadReply(@CurrentUser() user: any, @Body() body: AiTradeservLeadReplyDto) {
    return this.aiTradeserv.writeProposal(user.companyId, user.id, body);
  }

  @Post('market-insights')
  @ApiOperation({ summary: 'AI market insights' })
  async marketInsights(@CurrentUser() user: any, @Body() body: AiTradeservMarketInsightsDto) {
    return this.aiTradeserv.suggestCategories(user.companyId, user.id, body);
  }

  @Post('competitor-analysis')
  @ApiOperation({ summary: 'AI competitor analysis' })
  async competitorAnalysis(@CurrentUser() user: any, @Body() body: AiTradeservCompetitorAnalysisDto) {
    return this.aiTradeserv.writeProfile(user.companyId, user.id, body);
  }

  @Get('recommendations')
  @ApiOperation({ summary: 'AI recommendations for professional growth' })
  async recommendations(@CurrentUser() user: any, @Query() query: AiTradeservRecommendationsQueryDto) {
    return this.aiTradeserv.getRecommendations(user.companyId, user.id, { limit: query.limit ? +query.limit : undefined });
  }

  @Get('dashboard-widgets')
  @ApiOperation({ summary: 'AI dashboard widgets with aggregated insights' })
  async dashboardWidgets(@CurrentUser() user: any) {
    return this.aiTradeserv.getDashboardWidgets(user.companyId);
  }

  @Get('marketplace-suggestions')
  @ApiOperation({ summary: 'Marketplace suggestions for profile improvement' })
  async marketplaceSuggestions(@CurrentUser() user: any) {
    return this.aiTradeserv.getMarketplaceSuggestions(user.companyId);
  }

  @Get('growth-suggestions')
  @ApiOperation({ summary: 'AI growth suggestions' })
  async growthSuggestions(@CurrentUser() user: any) {
    return this.aiTradeserv.getGrowthSuggestions(user.companyId);
  }

  @Get('founder-insights')
  @ApiOperation({ summary: 'Founder-level business insights' })
  async founderInsights(@CurrentUser() user: any) {
    return this.aiTradeserv.getFounderInsights(user.companyId);
  }

  @Get('membership-benefits')
  @ApiOperation({ summary: 'Current membership benefits overview' })
  async membershipBenefits(@CurrentUser() user: any) {
    return this.aiTradeserv.getMembershipBenefits(user.companyId);
  }

  @Get('tradtrust-suggestions')
  @ApiOperation({ summary: 'TradTrust score improvement suggestions' })
  async tradTrustSuggestions(@CurrentUser() user: any) {
    return this.aiTradeserv.getTradTrustSuggestions(user.companyId);
  }

  @Get('gocash-rewards')
  @ApiOperation({ summary: 'GOCASH rewards and earning opportunities' })
  async gocashRewards(@CurrentUser() user: any) {
    return this.aiTradeserv.getGocashRewards(user.companyId);
  }

  @Get('analytics-cards')
  @ApiOperation({ summary: 'Analytics cards for dashboard' })
  async analyticsCards(@CurrentUser() user: any) {
    return this.aiTradeserv.getAnalyticsCards(user.companyId);
  }
}
