import { Controller, Get, Post, Patch, Param, Body, Query, UseGuards, HttpCode } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { SmartRfqService } from './smart-rfq.service';
import { AiRfqService } from './ai-rfq.service';
import { NearToFarService } from './near-to-far.service';
import { RfqSellerService } from './rfq-seller.service';
import { RfqAdminService } from './rfq-admin.service';
import { CreateRfqDto } from './dto/create-rfq.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';
import {
  NaturalLanguageRfqDto, RefineRfqDto, DetectMissingDto, DetectDuplicatesDto,
  PredictCategoryDto, SuggestProductsDto, SuggestSuppliersDto, QualityScoreDto,
  TranslateRfqDto, AiAssistantDto,
} from './dto/ai-rfq.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Smart RFQ Engine')
@UseGuards(JwtAuthGuard)
@Controller('smart-rfq')
export class SmartRfqController {
  constructor(
    private readonly rfqService: SmartRfqService,
    private readonly aiRfq: AiRfqService,
    private readonly nearToFar: NearToFarService,
    private readonly sellerService: RfqSellerService,
    private readonly adminService: RfqAdminService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create RFQ from any source' })
  create(@CurrentUser('sub') userId: string, @Body() dto: CreateRfqDto) {
    return this.rfqService.createFromSource(userId, dto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get RFQ by ID' })
  findById(@CurrentUser('sub') userId: string, @Param('id') id: string) {
    return this.rfqService.findById(userId, id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update RFQ' })
  update(@CurrentUser('sub') userId: string, @Param('id') id: string, @Body() dto: { title?: string; description?: string; expiresAt?: string; status?: string }) {
    return this.rfqService.updateRfq(userId, id, dto);
  }

  @Get(':id/quotes')
  @ApiOperation({ summary: 'List quotes for an RFQ (buyer)' })
  findQuotes(@CurrentUser('sub') userId: string, @Param('id') id: string) {
    return this.rfqService.findQuotes(userId, id);
  }

  @Get()
  @ApiOperation({ summary: 'List my RFQs (buyer)' })
  findMy(@CurrentUser('sub') userId: string, @Query('status') status?: string, @Query() pagination?: PaginationDto) {
    return this.rfqService.findMyRfqs(userId, status, pagination);
  }

  @Post(':id/duplicate')
  @ApiOperation({ summary: 'Duplicate an RFQ' })
  duplicate(@CurrentUser('sub') userId: string, @Param('id') id: string) {
    return this.rfqService.duplicate(userId, id);
  }

  @Post(':rfqId/accept-quote/:quoteId')
  @ApiOperation({ summary: 'Accept a quote (buyer)' })
  acceptQuote(@CurrentUser('sub') userId: string, @Param('rfqId') rfqId: string, @Param('quoteId') quoteId: string) {
    return this.rfqService.acceptQuote(userId, rfqId, quoteId);
  }

  @Post(':rfqId/reject-quote/:quoteId')
  @ApiOperation({ summary: 'Reject a quote (buyer)' })
  rejectQuote(@CurrentUser('sub') userId: string, @Param('rfqId') rfqId: string, @Param('quoteId') quoteId: string) {
    return this.rfqService.rejectQuote(userId, rfqId, quoteId);
  }

  @Get(':id/suppliers')
  @ApiOperation({ summary: 'Near To Far™ supplier suggestions' })
  findSuppliers(@Param('id') id: string) {
    return this.nearToFar.findSuppliers(id);
  }

  @Get('near-to-far/stats')
  @ApiOperation({ summary: 'Near To Far™ matching stats' })
  getMatchingStats() {
    return this.nearToFar.getMatchingStats();
  }

  @Get('seller/incoming')
  @ApiOperation({ summary: 'List incoming RFQs (seller)' })
  getIncomingRfqs(@CurrentUser('sub') userId: string, @Query('status') status?: string, @Query() pagination?: PaginationDto) {
    return this.rfqService.getUserCompany(userId).then((c) => this.sellerService.getIncomingRfqs(c.id, status, pagination));
  }

  @Post('seller/:rfqId/accept')
  @HttpCode(204)
  @ApiOperation({ summary: 'Accept an RFQ (seller)' })
  acceptRfq(@CurrentUser('sub') userId: string, @Param('rfqId') rfqId: string) {
    return this.rfqService.getUserCompany(userId).then((c) => this.sellerService.acceptRfq(rfqId, c.id));
  }

  @Post('seller/:rfqId/decline')
  @HttpCode(204)
  @ApiOperation({ summary: 'Decline an RFQ (seller)' })
  declineRfq(@CurrentUser('sub') userId: string, @Param('rfqId') rfqId: string, @Body('reason') reason?: string) {
    return this.rfqService.getUserCompany(userId).then((c) => this.sellerService.declineRfq(rfqId, c.id, reason));
  }

  @Get('seller/stats')
  @ApiOperation({ summary: 'Seller RFQ stats' })
  getSellerStats(@CurrentUser('sub') userId: string) {
    return this.rfqService.getUserCompany(userId).then((c) => this.sellerService.getRfqStats(c.id));
  }

  @Get('quality/metrics')
  @ApiOperation({ summary: 'RFQ quality metrics (completeness, response rate, conversion)' })
  getQualityMetrics(@CurrentUser('sub') userId: string, @Query('startDate') startDate?: string, @Query('endDate') endDate?: string) {
    return this.rfqService.getUserCompany(userId).then((c) => this.rfqService.getRfqQualityMetrics(c.id, startDate, endDate));
  }

  @Get('quote/performance')
  @ApiOperation({ summary: 'Quote performance metrics (acceptance rate, avg value)' })
  getQuotePerformance(@CurrentUser('sub') userId: string, @Query('startDate') startDate?: string, @Query('endDate') endDate?: string) {
    return this.rfqService.getUserCompany(userId).then((c) => this.rfqService.getQuotePerformanceMetrics(c.id, startDate, endDate));
  }

  @Get('admin/overview')
  @UseGuards(RolesGuard)
  @Roles('SUPER_ADMIN', 'ADMIN')
  @ApiOperation({ summary: 'Admin RFQ overview stats' })
  getAdminOverview() {
    return this.adminService.getOverview();
  }

  @Get('admin/rfqs')
  @UseGuards(RolesGuard)
  @Roles('SUPER_ADMIN', 'ADMIN')
  @ApiOperation({ summary: 'Admin list all RFQs' })
  getAdminRfqs(@Query('status') status?: string, @Query() pagination?: PaginationDto) {
    return this.adminService.getRfqs(status, pagination);
  }

  @Get('admin/flagged')
  @UseGuards(RolesGuard)
  @Roles('SUPER_ADMIN', 'ADMIN')
  @ApiOperation({ summary: 'Admin flagged RFQs' })
  getFlaggedRfqs(@Query() pagination?: PaginationDto) {
    return this.adminService.getFlaggedRfqs(pagination);
  }

  @Get('admin/audit-trail')
  @UseGuards(RolesGuard)
  @Roles('SUPER_ADMIN', 'ADMIN')
  @ApiOperation({ summary: 'Admin RFQ audit trail' })
  getAuditTrail(@Query() pagination?: PaginationDto) {
    return this.adminService.getAuditTrail(pagination);
  }

  @Post('ai/generate-from-text')
  @ApiOperation({ summary: '1. Natural Language RFQ — generate structured RFQ from buyer text' })
  generateFromText(@CurrentUser('sub') userId: string, @CurrentUser('companyId') companyId: string, @Body() dto: NaturalLanguageRfqDto) {
    return this.aiRfq.generateFromText(dto, companyId || 'system', userId)
  }

  @Post(':id/ai/refine')
  @ApiOperation({ summary: '2. AI Requirement Refinement — improve existing RFQ' })
  refineRfq(@CurrentUser('sub') userId: string, @CurrentUser('companyId') companyId: string, @Param('id') id: string, @Body() dto: RefineRfqDto) {
    return this.aiRfq.refineRfq({ ...dto, rfqId: id }, companyId || 'system', userId)
  }

  @Post('ai/detect-missing')
  @ApiOperation({ summary: '3. Missing Information Detection — identify RFQ gaps' })
  detectMissing(@CurrentUser('sub') userId: string, @CurrentUser('companyId') companyId: string, @Body() dto: DetectMissingDto) {
    return this.aiRfq.detectMissing(dto, companyId || 'system', userId)
  }

  @Post('ai/detect-duplicates')
  @ApiOperation({ summary: '4. Duplicate RFQ Detection — find similar existing RFQs' })
  detectDuplicates(@CurrentUser('sub') userId: string, @CurrentUser('companyId') companyId: string, @Body() dto: DetectDuplicatesDto) {
    return this.aiRfq.detectDuplicates(dto, companyId || 'system', userId)
  }

  @Post('ai/predict-category')
  @ApiOperation({ summary: '5. AI Category Prediction — predict best category from product name' })
  predictCategory(@CurrentUser('sub') userId: string, @CurrentUser('companyId') companyId: string, @Body() dto: PredictCategoryDto) {
    return this.aiRfq.predictCategory(dto, companyId || 'system', userId)
  }

  @Post('ai/suggest-products')
  @ApiOperation({ summary: '6. AI Product Suggestions — match products from catalog' })
  suggestProducts(@CurrentUser('sub') userId: string, @CurrentUser('companyId') companyId: string, @Body() dto: SuggestProductsDto) {
    return this.aiRfq.suggestProducts(dto, companyId || 'system', userId)
  }

  @Post(':id/ai/suggest-suppliers')
  @ApiOperation({ summary: '7. AI Supplier Suggestions — find matching suppliers via TradFind' })
  suggestSuppliers(@CurrentUser('sub') userId: string, @CurrentUser('companyId') companyId: string, @Param('id') id: string, @Body() dto: SuggestSuppliersDto) {
    return this.aiRfq.suggestSuppliers({ ...dto, rfqId: id }, companyId || 'system', userId)
  }

  @Post('ai/quality-score')
  @ApiOperation({ summary: '8. RFQ Quality Score — 0-100 with improvement suggestions' })
  qualityScore(@CurrentUser('sub') userId: string, @CurrentUser('companyId') companyId: string, @Body() dto: QualityScoreDto) {
    return this.aiRfq.calculateQualityScore(dto, companyId || 'system', userId)
  }

  @Post(':id/ai/translate')
  @ApiOperation({ summary: '9. Multi-language RFQ — generate RFQ in supported languages' })
  translateRfq(@CurrentUser('sub') userId: string, @CurrentUser('companyId') companyId: string, @Param('id') id: string, @Body() dto: TranslateRfqDto) {
    return this.aiRfq.translateRfq({ ...dto, rfqId: id }, companyId || 'system', userId)
  }

  @Post('ai/assistant')
  @ApiOperation({ summary: '10. AI Assistant Sidebar — consolidated suggestions, warnings, recommendations' })
  getAssistantData(@CurrentUser('sub') userId: string, @CurrentUser('companyId') companyId: string, @Body() dto: AiAssistantDto) {
    return this.aiRfq.getAssistantData(dto, companyId || 'system', userId)
  }
}
