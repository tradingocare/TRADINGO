import { Controller, Post, Param, Body, UseGuards } from '@nestjs/common'
import { ApiTags, ApiOperation } from '@nestjs/swagger'
import { AiQuoteService } from './ai-quote.service'
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard'
import { CompanyOwnerGuard } from '../../common/guards/company-owner.guard'
import { CurrentUser } from '../../common/decorators/current-user.decorator'
import {
  AiQuoteGenerateDto,
  AiQuotePriceRecommendationDto,
  AiQuoteWinningProbabilityDto,
  AiQuoteMarginAnalysisDto,
  AiQuoteCompetitivenessDto,
  AiQuoteReviewDto,
  AiQuoteNegotiationPrepDto,
  AiQuoteRiskAssessmentDto,
  AiQuoteQualityScoreDto,
  AiQuoteSidebarDto,
} from './dto/ai-quote.dto'

@ApiTags('AI QUOTE')
@UseGuards(JwtAuthGuard, CompanyOwnerGuard)
@Controller('companies/:companyId/quote/ai')
export class AiQuoteController {
  constructor(private readonly aiQuoteService: AiQuoteService) {}

  @Post('generate')
  @ApiOperation({ summary: 'Generate quote from natural language or RFQ context' })
  async generate(
    @Param('companyId') companyId: string,
    @Body() dto: AiQuoteGenerateDto,
    @CurrentUser('sub') userId: string,
  ) {
    return this.aiQuoteService.generate(companyId, userId, dto)
  }

  @Post('price-recommendation')
  @ApiOperation({ summary: 'Recommend optimal pricing based on market data' })
  async priceRecommendation(
    @Param('companyId') companyId: string,
    @Body() dto: AiQuotePriceRecommendationDto,
    @CurrentUser('sub') userId: string,
  ) {
    return this.aiQuoteService.priceRecommendation(companyId, userId, dto)
  }

  @Post('winning-probability')
  @ApiOperation({ summary: 'Predict win probability using price, delivery, trust, competition' })
  async winningProbability(
    @Param('companyId') companyId: string,
    @Body() dto: AiQuoteWinningProbabilityDto,
    @CurrentUser('sub') userId: string,
  ) {
    return this.aiQuoteService.winningProbability(companyId, userId, dto)
  }

  @Post('margin-analysis')
  @ApiOperation({ summary: 'Analyze profit margins with actionable recommendations' })
  async marginAnalysis(
    @Param('companyId') companyId: string,
    @Body() dto: AiQuoteMarginAnalysisDto,
    @CurrentUser('sub') userId: string,
  ) {
    return this.aiQuoteService.marginAnalysis(companyId, userId, dto)
  }

  @Post('competitiveness')
  @ApiOperation({ summary: 'Score quote competitiveness against market benchmarks' })
  async competitiveness(
    @Param('companyId') companyId: string,
    @Body() dto: AiQuoteCompetitivenessDto,
    @CurrentUser('sub') userId: string,
  ) {
    return this.aiQuoteService.competitivenessScore(companyId, userId, dto)
  }

  @Post('review')
  @ApiOperation({ summary: 'Review quote for completeness, errors, and improvements' })
  async review(
    @Param('companyId') companyId: string,
    @Body() dto: AiQuoteReviewDto,
    @CurrentUser('sub') userId: string,
  ) {
    return this.aiQuoteService.review(companyId, userId, dto)
  }

  @Post('negotiation-prep')
  @ApiOperation({ summary: 'Prepare negotiation strategy using buyer history' })
  async negotiationPrep(
    @Param('companyId') companyId: string,
    @Body() dto: AiQuoteNegotiationPrepDto,
    @CurrentUser('sub') userId: string,
  ) {
    return this.aiQuoteService.negotiationPrep(companyId, userId, dto)
  }

  @Post('risk-assessment')
  @ApiOperation({ summary: 'Assess buyer credit and trust risk' })
  async riskAssessment(
    @Param('companyId') companyId: string,
    @Body() dto: AiQuoteRiskAssessmentDto,
    @CurrentUser('sub') userId: string,
  ) {
    return this.aiQuoteService.riskAssessment(companyId, userId, dto)
  }

  @Post('quality-score')
  @ApiOperation({ summary: 'Score quote quality and completeness' })
  async qualityScore(
    @Param('companyId') companyId: string,
    @Body() dto: AiQuoteQualityScoreDto,
    @CurrentUser('sub') userId: string,
  ) {
    return this.aiQuoteService.qualityScore(companyId, userId, dto)
  }

  @Post('sidebar')
  @ApiOperation({ summary: 'All-in-one sidebar data for the quote builder' })
  async sidebar(
    @Param('companyId') companyId: string,
    @Body() dto: AiQuoteSidebarDto,
    @CurrentUser('sub') userId: string,
  ) {
    return this.aiQuoteService.sidebar(companyId, userId, dto)
  }
}
