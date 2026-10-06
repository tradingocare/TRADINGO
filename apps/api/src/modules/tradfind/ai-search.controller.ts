import { Controller, Post, Body, UseGuards, Req } from '@nestjs/common'
import { ApiTags, ApiOperation } from '@nestjs/swagger'
import { AiSearchService } from './ai-search.service'
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard'
import { Public } from '../../common/decorators/public.decorator'
import { Throttle } from '@nestjs/throttler'
import { COMPANY_LESS_USAGE_KEY } from '../ai-gateway/ai-credits.service'
import {
  AiSemanticSearchDto,
  AiSearchIntentDto,
  AiSimilarProductsDto,
  AiSimilarSuppliersDto,
  AiPersonalizedRankingDto,
  AiBuyerRecommendationsDto,
  AiSellerRecommendationsDto,
  AiSearchSummaryDto,
  AiSmartFiltersDto,
  AiCrossSellDto,
  AiSearchSidebarDto,
} from './dto/ai-search.dto'

interface RequestWithUser extends Request {
  user?: { id: string; companyId?: string }
  // Trusted server-side client IP (trustProxy is enabled in main.ts; the
  // same req.ip convention used by turnstile/audit/beta-tracking flows).
  ip?: string
}

@ApiTags('AI Search')
@Controller('search/ai')
@Throttle({ default: { limit: 30, ttl: 60000 } })
export class AiSearchController {
  constructor(private readonly aiSearchService: AiSearchService) {}

  @Post('semantic')
  @ApiOperation({ summary: 'Perform semantic search' })
  @Public()
  async semanticSearch(@Body() dto: AiSemanticSearchDto, @Req() req: RequestWithUser) {
    return this.aiSearchService.semanticSearch(req.user?.companyId || COMPANY_LESS_USAGE_KEY, req.user?.id || COMPANY_LESS_USAGE_KEY, dto, req.ip)
  }

  @Post('intent')
  @ApiOperation({ summary: 'Detect search intent' })
  @Public()
  async searchIntent(@Body() dto: AiSearchIntentDto, @Req() req: RequestWithUser) {
    return this.aiSearchService.searchIntentDetection(req.user?.companyId || COMPANY_LESS_USAGE_KEY, req.user?.id || COMPANY_LESS_USAGE_KEY, dto, req.ip)
  }

  @Post('similar-products')
  @ApiOperation({ summary: 'Find similar products' })
  @Public()
  async similarProducts(@Body() dto: AiSimilarProductsDto, @Req() req: RequestWithUser) {
    return this.aiSearchService.similarProducts(req.user?.companyId || COMPANY_LESS_USAGE_KEY, req.user?.id || COMPANY_LESS_USAGE_KEY, dto, req.ip)
  }

  @Post('similar-suppliers')
  @ApiOperation({ summary: 'Find similar suppliers' })
  @Public()
  async similarSuppliers(@Body() dto: AiSimilarSuppliersDto, @Req() req: RequestWithUser) {
    return this.aiSearchService.similarSuppliers(req.user?.companyId || COMPANY_LESS_USAGE_KEY, req.user?.id || COMPANY_LESS_USAGE_KEY, dto, req.ip)
  }

  @Post('personalized-ranking')
  @ApiOperation({ summary: 'Get personalized ranking' })
  @UseGuards(JwtAuthGuard)
  async personalizedRanking(@Body() dto: AiPersonalizedRankingDto, @Req() req: RequestWithUser) {
    const companyId = req.user?.companyId || req.user?.id || COMPANY_LESS_USAGE_KEY
    const userId = req.user?.id || COMPANY_LESS_USAGE_KEY
    return this.aiSearchService.personalizedRanking(companyId, userId, dto, req.ip)
  }

  @Post('buyer-recommendations')
  @ApiOperation({ summary: 'Get buyer recommendations' })
  @UseGuards(JwtAuthGuard)
  async buyerRecommendations(@Body() dto: AiBuyerRecommendationsDto, @Req() req: RequestWithUser) {
    const companyId = req.user?.companyId || req.user?.id || COMPANY_LESS_USAGE_KEY
    const userId = req.user?.id || COMPANY_LESS_USAGE_KEY
    return this.aiSearchService.buyerRecommendations(companyId, userId, dto, req.ip)
  }

  @Post('seller-recommendations')
  @ApiOperation({ summary: 'Get seller recommendations' })
  @UseGuards(JwtAuthGuard)
  async sellerRecommendations(@Body() dto: AiSellerRecommendationsDto, @Req() req: RequestWithUser) {
    const companyId = req.user?.companyId || req.user?.id || COMPANY_LESS_USAGE_KEY
    const userId = req.user?.id || COMPANY_LESS_USAGE_KEY
    return this.aiSearchService.sellerRecommendations(companyId, userId, dto, req.ip)
  }

  @Post('summary')
  @ApiOperation({ summary: 'Get search summary' })
  @Public()
  async searchSummary(@Body() dto: AiSearchSummaryDto, @Req() req: RequestWithUser) {
    return this.aiSearchService.searchSummary(req.user?.companyId || COMPANY_LESS_USAGE_KEY, req.user?.id || COMPANY_LESS_USAGE_KEY, dto, req.ip)
  }

  @Post('smart-filters')
  @ApiOperation({ summary: 'Get smart filters' })
  @Public()
  async smartFilters(@Body() dto: AiSmartFiltersDto, @Req() req: RequestWithUser) {
    return this.aiSearchService.smartFilters(req.user?.companyId || COMPANY_LESS_USAGE_KEY, req.user?.id || COMPANY_LESS_USAGE_KEY, dto, req.ip)
  }

  @Post('cross-sell')
  @ApiOperation({ summary: 'Get cross-sell suggestions' })
  @Public()
  async crossSellUpsell(@Body() dto: AiCrossSellDto, @Req() req: RequestWithUser) {
    return this.aiSearchService.crossSellUpsell(req.user?.companyId || COMPANY_LESS_USAGE_KEY, req.user?.id || COMPANY_LESS_USAGE_KEY, dto, req.ip)
  }

  @Post('sidebar')
  @ApiOperation({ summary: 'Get AI search sidebar' })
  @Public()
  async aiSearchSidebar(@Body() dto: AiSearchSidebarDto, @Req() req: RequestWithUser) {
    return this.aiSearchService.aiSearchSidebar(req.user?.companyId || COMPANY_LESS_USAGE_KEY, req.user?.id || COMPANY_LESS_USAGE_KEY, dto, req.ip)
  }
}
