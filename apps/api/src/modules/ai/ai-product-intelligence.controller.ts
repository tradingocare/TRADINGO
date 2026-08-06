import { Controller, Get, Post, Patch, Body, Param, Query, Req, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Throttle } from '@nestjs/throttler';
import { AiProductIntelligenceService } from './ai-product-intelligence.service';
import {
  GenerateDescriptionDto, GenerateSeoDto, TranslateProductDto, SuggestSpecsDto, SuggestImagesDto,
  UpdateSeoDto, AcceptAiSuggestionDto, GenerateTitleDto, SuggestAttributesDto, SuggestCategoryDto,
  GenerateHighlightsDto, GenerateTagsDto, SuggestHsnGstDto, SuggestRelatedProductsDto, GenerateMetaKeywordsDto,
} from './dto/ai.dto';
import { Roles } from '../../common/decorators/roles.decorator';

@ApiTags('AI Product Intelligence')
@Controller('ai/products')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles('SELLER', 'ADMIN', 'SUPER_ADMIN')
@Throttle({ default: { limit: 30, ttl: 60000 } })
export class AiProductIntelligenceController {
  constructor(private readonly aiService: AiProductIntelligenceService) {}

  @ApiOperation({ summary: 'Generate product description using AI' })
  @Post('generate-description')
  generateDescription(@Body() dto: GenerateDescriptionDto, @Req() req: any) { return this.aiService.generateDescription(dto, req.user.id); }

  @ApiOperation({ summary: 'Generate SEO metadata for product' })
  @Post('generate-seo')
  generateSeo(@Body() dto: GenerateSeoDto, @Req() req: any) { return this.aiService.generateSeo(dto, req.user.id); }

  @ApiOperation({ summary: 'Translate product content' })
  @Post('translate')
  translate(@Body() dto: TranslateProductDto, @Req() req: any) { return this.aiService.translateProduct(dto, req.user.id); }

  @ApiOperation({ summary: 'Suggest product specifications' })
  @Post('suggest-specs')
  suggestSpecs(@Body() dto: SuggestSpecsDto, @Req() req: any) { return this.aiService.suggestSpecs(dto, req.user.id); }

  @ApiOperation({ summary: 'Suggest product images' })
  @Post('suggest-images')
  suggestImages(@Body() dto: SuggestImagesDto, @Req() req: any) { return this.aiService.suggestImages(dto, req.user.id); }

  @ApiOperation({ summary: 'Generate product title' })
  @Post('generate-title')
  generateTitle(@Body() dto: GenerateTitleDto, @Req() req: any) { return this.aiService.generateTitle(dto, req.user.id); }

  @ApiOperation({ summary: 'Suggest product attributes' })
  @Post('suggest-attributes')
  suggestAttributes(@Body() dto: SuggestAttributesDto, @Req() req: any) { return this.aiService.suggestAttributes(dto, req.user.id); }

  @ApiOperation({ summary: 'Suggest product category' })
  @Post('suggest-category')
  suggestCategory(@Body() dto: SuggestCategoryDto, @Req() req: any) { return this.aiService.suggestCategory(dto, req.user.id); }

  @ApiOperation({ summary: 'Update product SEO metadata' })
  @Patch(':productId/seo')
  updateSeo(@Param('productId') productId: string, @Body() dto: UpdateSeoDto, @Req() req: any) { return this.aiService.updateSeo(productId, dto, req.user.id); }

  @ApiOperation({ summary: 'Get AI cache for product' })
  @Get(':productId/cache')
  getCache(@Param('productId') productId: string, @Query('cacheType') cacheType?: string) { return this.aiService.getAiCache(productId, cacheType as any); }

  @ApiOperation({ summary: 'Accept AI suggestion' })
  @Post('accept-suggestion')
  acceptSuggestion(@Body() dto: AcceptAiSuggestionDto, @Req() req: any) { return this.aiService.acceptSuggestion(dto, req.user.id); }

  @ApiOperation({ summary: 'Generate product highlights' })
  @Post('generate-highlights')
  generateHighlights(@Body() dto: GenerateHighlightsDto, @Req() req: any) { return this.aiService.generateHighlights(dto, req.user.id); }

  @ApiOperation({ summary: 'Generate product tags' })
  @Post('generate-tags')
  generateTags(@Body() dto: GenerateTagsDto, @Req() req: any) { return this.aiService.generateTags(dto, req.user.id); }

  @ApiOperation({ summary: 'Suggest HSN/GST code' })
  @Post('suggest-hsn-gst')
  suggestHsnGst(@Body() dto: SuggestHsnGstDto, @Req() req: any) { return this.aiService.suggestHsnGst(dto, req.user.id); }

  @ApiOperation({ summary: 'Suggest related products' })
  @Post('suggest-related')
  suggestRelatedProducts(@Body() dto: SuggestRelatedProductsDto, @Req() req: any) { return this.aiService.suggestRelatedProducts(dto, req.user.id); }

  @ApiOperation({ summary: 'Generate meta keywords' })
  @Post('generate-meta-keywords')
  generateMetaKeywords(@Body() dto: GenerateMetaKeywordsDto, @Req() req: any) { return this.aiService.generateMetaKeywords(dto, req.user.id); }
}
