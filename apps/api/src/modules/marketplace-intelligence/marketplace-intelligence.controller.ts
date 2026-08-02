import { Controller, Get, Post, Query, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { MarketplaceIntelligenceService, BestSupplierResult } from './marketplace-intelligence.service';
import { MarketplaceIntelligenceEngine } from './marketplace-intelligence.engine';
import { LocationIntelligenceService } from '../location-intelligence/location-intelligence.service';
import { CustomerSegmentationService } from './customer-segmentation.service';
import { BestSupplierQueryDto, RecordEventDto } from './dto/marketplace.dto';
import {
  NearFarQueryDto, SellerRecommendationsQueryDto, BuyerRecommendationsQueryDto,
  RelationshipQueryDto, DeliveryPredictionDto, BusinessIntelligenceQueryDto,
} from './dto/marketplace-engine.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { Throttle } from '@nestjs/throttler';

@ApiTags('Marketplace Intelligence')
@UseGuards(JwtAuthGuard)
@Throttle({ default: { limit: 30, ttl: 60000 } })
@Controller('marketplace-intelligence')
export class MarketplaceIntelligenceController {
  constructor(
    private readonly marketplaceIntelligence: MarketplaceIntelligenceService,
    private readonly engine: MarketplaceIntelligenceEngine,
    private readonly locationIntelligence: LocationIntelligenceService,
    private readonly segmentation: CustomerSegmentationService,
  ) {}

  @Get('best-suppliers')
  @ApiOperation({ summary: 'Get best suppliers' })
  async getBestSuppliers(@Query() query: BestSupplierQueryDto): Promise<BestSupplierResult[]> {
    return this.marketplaceIntelligence.findBestSuppliers({
      buyerId: query.buyerId,
      lat: query.lat,
      lng: query.lng,
      radiusKm: query.radius,
      categoryId: query.categoryId,
      limit: query.limit,
    });
  }

  @Get('buyer-recommendations')
  @ApiOperation({ summary: 'Get buyer recommendations' })
  async getBuyerRecommendations(
    @Query() query: BuyerRecommendationsQueryDto,
  ) {
    return this.engine.getBuyerRecommendations(query.buyerId, query.companyId, query.limit ?? 10);
  }

  @Post('record-event')
  @ApiOperation({ summary: 'Record marketplace event' })
  async recordEvent(@Body() body: RecordEventDto) {
    await this.locationIntelligence.recordBuyerHistory(body);
    return { message: 'Event recorded' };
  }

  @Get('score/:companyId')
  @ApiOperation({ summary: 'Get unified supplier score' })
  async getUnifiedScore(@Param('companyId') companyId: string) {
    return this.engine.getUnifiedScore(companyId);
  }

  @Get('near-far-suppliers')
  @ApiOperation({ summary: 'Find suppliers with location expansion' })
  async findSuppliersWithExpansion(@Query() query: NearFarQueryDto) {
    return this.engine.findSuppliersWithExpansion(query);
  }

  @Get('seller-recommendations')
  @ApiOperation({ summary: 'Get seller recommendations' })
  async getSellerRecommendations(@Query() query: SellerRecommendationsQueryDto) {
    return this.engine.getSellerRecommendations(query.companyId, query.limit ?? 10);
  }

  @Get('rankings')
  @ApiOperation({ summary: 'Get marketplace rankings' })
  async getMarketplaceRankings() {
    return this.engine.getMarketplaceRankings();
  }

  @Get('geo-intelligence')
  @ApiOperation({ summary: 'Get geo intelligence data' })
  async getGeoIntelligence() {
    return this.engine.getGeoIntelligence();
  }

  @Get('business-intelligence')
  @ApiOperation({ summary: 'Get business intelligence' })
  async getBusinessIntelligence(@Query() query: BusinessIntelligenceQueryDto) {
    return this.engine.getBusinessIntelligence(query.companyId);
  }

  @Get('relationship')
  @ApiOperation({ summary: 'Get buyer relationship intelligence' })
  async getBuyerRelationshipIntelligence(@Query() query: RelationshipQueryDto) {
    return this.engine.getBuyerRelationshipIntelligence(query.buyerId, query.sellerId);
  }

  @Post('delivery-prediction')
  @ApiOperation({ summary: 'Get delivery prediction' })
  async getDeliveryPrediction(@Body() body: DeliveryPredictionDto) {
    return this.engine.getDeliveryPrediction(body);
  }

  @Get('relationship-score')
  @ApiOperation({ summary: 'Get relationship score' })
  async getRelationshipScore(@Query() query: RelationshipQueryDto) {
    return this.engine.getRelationshipScore(query.buyerId, query.sellerId);
  }

  @Get('segments')
  @ApiOperation({ summary: 'Get customer segments' })
  async getCustomerSegments(@Query('companyId') companyId?: string) {
    return this.segmentation.getSegments(companyId);
  }

  @Get('segments/:segment')
  @ApiOperation({ summary: 'Get companies by segment' })
  async getCompaniesBySegment(@Param('segment') segment: string, @Query('companyId') companyId?: string) {
    return this.segmentation.getCompaniesBySegment(segment, companyId);
  }
}
