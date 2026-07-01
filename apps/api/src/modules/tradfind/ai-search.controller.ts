import { Controller, Post, Body, UseGuards, Req } from '@nestjs/common'
import { AiSearchService } from './ai-search.service'
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard'
import { Public } from '../../common/decorators/public.decorator'
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
}

@Controller('search/ai')
export class AiSearchController {
  constructor(private readonly aiSearchService: AiSearchService) {}

  @Post('semantic')
  @Public()
  async semanticSearch(@Body() dto: AiSemanticSearchDto, @Req() req: RequestWithUser) {
    return this.aiSearchService.semanticSearch(req.user?.companyId || 'anonymous', req.user?.id || 'anonymous', dto)
  }

  @Post('intent')
  @Public()
  async searchIntent(@Body() dto: AiSearchIntentDto, @Req() req: RequestWithUser) {
    return this.aiSearchService.searchIntentDetection(req.user?.companyId || 'anonymous', req.user?.id || 'anonymous', dto)
  }

  @Post('similar-products')
  @Public()
  async similarProducts(@Body() dto: AiSimilarProductsDto, @Req() req: RequestWithUser) {
    return this.aiSearchService.similarProducts(req.user?.companyId || 'anonymous', req.user?.id || 'anonymous', dto)
  }

  @Post('similar-suppliers')
  @Public()
  async similarSuppliers(@Body() dto: AiSimilarSuppliersDto, @Req() req: RequestWithUser) {
    return this.aiSearchService.similarSuppliers(req.user?.companyId || 'anonymous', req.user?.id || 'anonymous', dto)
  }

  @Post('personalized-ranking')
  @UseGuards(JwtAuthGuard)
  async personalizedRanking(@Body() dto: AiPersonalizedRankingDto, @Req() req: RequestWithUser) {
    const companyId = req.user?.companyId || req.user?.id || 'anonymous'
    const userId = req.user?.id || 'anonymous'
    return this.aiSearchService.personalizedRanking(companyId, userId, dto)
  }

  @Post('buyer-recommendations')
  @UseGuards(JwtAuthGuard)
  async buyerRecommendations(@Body() dto: AiBuyerRecommendationsDto, @Req() req: RequestWithUser) {
    const companyId = req.user?.companyId || req.user?.id || 'anonymous'
    const userId = req.user?.id || 'anonymous'
    return this.aiSearchService.buyerRecommendations(companyId, userId, dto)
  }

  @Post('seller-recommendations')
  @UseGuards(JwtAuthGuard)
  async sellerRecommendations(@Body() dto: AiSellerRecommendationsDto, @Req() req: RequestWithUser) {
    const companyId = req.user?.companyId || req.user?.id || 'anonymous'
    const userId = req.user?.id || 'anonymous'
    return this.aiSearchService.sellerRecommendations(companyId, userId, dto)
  }

  @Post('summary')
  @Public()
  async searchSummary(@Body() dto: AiSearchSummaryDto, @Req() req: RequestWithUser) {
    return this.aiSearchService.searchSummary(req.user?.companyId || 'anonymous', req.user?.id || 'anonymous', dto)
  }

  @Post('smart-filters')
  @Public()
  async smartFilters(@Body() dto: AiSmartFiltersDto, @Req() req: RequestWithUser) {
    return this.aiSearchService.smartFilters(req.user?.companyId || 'anonymous', req.user?.id || 'anonymous', dto)
  }

  @Post('cross-sell')
  @Public()
  async crossSellUpsell(@Body() dto: AiCrossSellDto, @Req() req: RequestWithUser) {
    return this.aiSearchService.crossSellUpsell(req.user?.companyId || 'anonymous', req.user?.id || 'anonymous', dto)
  }

  @Post('sidebar')
  @Public()
  async aiSearchSidebar(@Body() dto: AiSearchSidebarDto, @Req() req: RequestWithUser) {
    return this.aiSearchService.aiSearchSidebar(req.user?.companyId || 'anonymous', req.user?.id || 'anonymous', dto)
  }
}
