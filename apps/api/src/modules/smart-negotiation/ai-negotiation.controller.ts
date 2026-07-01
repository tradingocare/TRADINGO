import { Controller, Post, Param, Body, UseGuards } from '@nestjs/common'
import { ApiTags, ApiOperation } from '@nestjs/swagger'
import { AiNegotiationService } from './ai-negotiation.service'
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard'
import { CurrentUser } from '../../common/decorators/current-user.decorator'
import {
  AiNegotiationStrategyDto,
  AiNegotiationBuyerBehaviorDto,
  AiNegotiationSellerSuggestionsDto,
  AiNegotiationSentimentDto,
  AiNegotiationProbabilityDto,
  AiNegotiationRepliesDto,
  AiNegotiationRiskDto,
  AiNegotiationSummaryDto,
  AiNegotiationTranslateDto,
  AiNegotiationMemoryDto,
  AiNegotiationTimelineDto,
  AiNegotiationSidebarDto,
} from './dto/ai-negotiation.dto'

@ApiTags('AI NEGOTIATION')
@UseGuards(JwtAuthGuard)
@Controller('smart-negotiation/:id/ai')
export class AiNegotiationController {
  constructor(private readonly aiNegotiationService: AiNegotiationService) {}

  @Post('strategy')
  @ApiOperation({ summary: 'Generate negotiation strategy with counter offer, walk-away price, discount, sequence, closing' })
  async strategy(
    @Param('id') id: string,
    @Body() dto: AiNegotiationStrategyDto,
    @CurrentUser('sub') userId: string,
  ) {
    return this.aiNegotiationService.generateStrategy(id, userId, { ...dto, negotiationId: id })
  }

  @Post('buyer-behavior')
  @ApiOperation({ summary: 'Analyze buyer price sensitivity, response speed, style, purchase intent, historical acceptance' })
  async buyerBehavior(
    @Param('id') id: string,
    @Body() dto: AiNegotiationBuyerBehaviorDto,
    @CurrentUser('sub') userId: string,
  ) {
    return this.aiNegotiationService.buyerBehaviorAnalysis(id, userId, { ...dto, negotiationId: id })
  }

  @Post('seller-suggestions')
  @ApiOperation({ summary: 'Suggest seller improvements: price, delivery, warranty, payment terms' })
  async sellerSuggestions(
    @Param('id') id: string,
    @Body() dto: AiNegotiationSellerSuggestionsDto,
    @CurrentUser('sub') userId: string,
  ) {
    return this.aiNegotiationService.sellerSuggestions(id, userId, { ...dto, negotiationId: id })
  }

  @Post('sentiment')
  @ApiOperation({ summary: 'Analyze conversation sentiment: positive, neutral, negative with confidence %' })
  async sentiment(
    @Param('id') id: string,
    @Body() dto: AiNegotiationSentimentDto,
    @CurrentUser('sub') userId: string,
  ) {
    return this.aiNegotiationService.sentimentAnalysis(id, userId, { ...dto, negotiationId: id })
  }

  @Post('probability')
  @ApiOperation({ summary: 'Predict deal closing probability with reason, confidence, improvement tips' })
  async probability(
    @Param('id') id: string,
    @Body() dto: AiNegotiationProbabilityDto,
    @CurrentUser('sub') userId: string,
  ) {
    return this.aiNegotiationService.dealProbability(id, userId, { ...dto, negotiationId: id })
  }

  @Post('replies')
  @ApiOperation({ summary: 'Generate suggested replies: professional, short, commercial, escalation' })
  async replies(
    @Param('id') id: string,
    @Body() dto: AiNegotiationRepliesDto,
    @CurrentUser('sub') userId: string,
  ) {
    return this.aiNegotiationService.suggestedReplies(id, userId, { ...dto, negotiationId: id })
  }

  @Post('risk')
  @ApiOperation({ summary: 'Detect payment risk, fraud signals, unrealistic demands, aggressive negotiation, commercial risk' })
  async risk(
    @Param('id') id: string,
    @Body() dto: AiNegotiationRiskDto,
    @CurrentUser('sub') userId: string,
  ) {
    return this.aiNegotiationService.riskDetection(id, userId, { ...dto, negotiationId: id })
  }

  @Post('summary')
  @ApiOperation({ summary: 'Generate conversation summary: key points, agreements, pending issues, action items' })
  async summary(
    @Param('id') id: string,
    @Body() dto: AiNegotiationSummaryDto,
    @CurrentUser('sub') userId: string,
  ) {
    return this.aiNegotiationService.conversationSummary(id, userId, { ...dto, negotiationId: id })
  }

  @Post('translate')
  @ApiOperation({ summary: 'Translate negotiation messages (multi-language support)' })
  async translate(
    @Param('id') id: string,
    @Body() dto: AiNegotiationTranslateDto,
    @CurrentUser('sub') userId: string,
  ) {
    return this.aiNegotiationService.translate(id, userId, dto)
  }

  @Post('memory')
  @ApiOperation({ summary: 'Retrieve AI memory from RFQ, Quote, Negotiation, Orders, CRM contexts' })
  async memory(
    @Param('id') id: string,
    @Body() dto: AiNegotiationMemoryDto,
    @CurrentUser('sub') userId: string,
  ) {
    return this.aiNegotiationService.aiMemory(id, userId, { ...dto, negotiationId: id })
  }

  @Post('timeline')
  @ApiOperation({ summary: 'Analyze negotiation timeline: offer history, counter offers, AI suggestions, final outcome' })
  async timeline(
    @Param('id') id: string,
    @Body() dto: AiNegotiationTimelineDto,
    @CurrentUser('sub') userId: string,
  ) {
    return this.aiNegotiationService.timeline(id, userId, { ...dto, negotiationId: id })
  }

  @Post('sidebar')
  @ApiOperation({ summary: 'All-in-one sidebar data for negotiation detail page' })
  async sidebar(
    @Param('id') id: string,
    @Body() dto: AiNegotiationSidebarDto,
    @CurrentUser('sub') userId: string,
  ) {
    return this.aiNegotiationService.sidebar(id, userId, { ...dto, negotiationId: id })
  }
}
