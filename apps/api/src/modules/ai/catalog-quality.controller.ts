import { Controller, Get, Post, Body, Param, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CatalogQualityService } from './catalog-quality.service';
import { QueryCatalogQualityDto, DetectDuplicatesDto, AiHealthDashboardDto } from './dto/ai.dto';

@Controller('ai/quality')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class CatalogQualityController {
  constructor(private readonly qualityService: CatalogQualityService) {}

  @Post('calculate/:productId')
  calculateScore(@Param('productId') productId: string) { return this.qualityService.calculateScore(productId); }

  @Get('scores')
  listScores(@Query() query: QueryCatalogQualityDto) { return this.qualityService.listScores(query); }

  @Get('scores/:productId')
  getScore(@Param('productId') productId: string) { return this.qualityService.getScore(productId); }

  @Get('dashboard')
  healthDashboard(@Query() dto: AiHealthDashboardDto) { return this.qualityService.getHealthDashboard(dto); }

  @Post('detect-duplicates')
  detectDuplicates(@Body() dto: DetectDuplicatesDto) { return this.qualityService.detectDuplicates(dto); }
}
