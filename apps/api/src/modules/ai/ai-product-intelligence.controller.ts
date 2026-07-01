import { Controller, Get, Post, Patch, Body, Param, Query, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../../common/guards/roles.guard';
import { AiProductIntelligenceService } from './ai-product-intelligence.service';
import { GenerateDescriptionDto, GenerateSeoDto, TranslateProductDto, SuggestSpecsDto, SuggestImagesDto, UpdateSeoDto, AcceptAiSuggestionDto } from './dto/ai.dto';

@Controller('ai/products')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class AiProductIntelligenceController {
  constructor(private readonly aiService: AiProductIntelligenceService) {}

  @Post('generate-description')
  generateDescription(@Body() dto: GenerateDescriptionDto, @Req() req: any) { return this.aiService.generateDescription(dto, req.user.id); }

  @Post('generate-seo')
  generateSeo(@Body() dto: GenerateSeoDto, @Req() req: any) { return this.aiService.generateSeo(dto, req.user.id); }

  @Post('translate')
  translate(@Body() dto: TranslateProductDto, @Req() req: any) { return this.aiService.translateProduct(dto, req.user.id); }

  @Post('suggest-specs')
  suggestSpecs(@Body() dto: SuggestSpecsDto, @Req() req: any) { return this.aiService.suggestSpecs(dto, req.user.id); }

  @Post('suggest-images')
  suggestImages(@Body() dto: SuggestImagesDto, @Req() req: any) { return this.aiService.suggestImages(dto, req.user.id); }

  @Patch(':productId/seo')
  updateSeo(@Param('productId') productId: string, @Body() dto: UpdateSeoDto, @Req() req: any) { return this.aiService.updateSeo(productId, dto, req.user.id); }

  @Get(':productId/cache')
  getCache(@Param('productId') productId: string, @Query('cacheType') cacheType?: string) { return this.aiService.getAiCache(productId, cacheType as any); }

  @Post('accept-suggestion')
  acceptSuggestion(@Body() dto: AcceptAiSuggestionDto, @Req() req: any) { return this.aiService.acceptSuggestion(dto, req.user.id); }
}
