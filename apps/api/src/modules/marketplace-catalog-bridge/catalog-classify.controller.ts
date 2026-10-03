import { Body, Controller, HttpCode, HttpStatus, Post, Req, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { Public } from '../../common/decorators/public.decorator';
import { CatalogClassifyService } from './catalog-classify.service';
import { ClassifyCatalogDto, ClassifyCatalogResponse } from './dto/classify-catalog.dto';

interface RequestWithUser extends Request {
  user?: { id: string; companyId?: string };
}

/**
 * Canonical taxonomy classification endpoint (Phase 11).
 *
 * Single entry point fronting the existing classification fragments
 * (exact catalog reads, synonym engine, AI gateway CATEGORY_SUGGESTION,
 * adapter unified search). Follows the established public-AI pattern
 * (cf. AiSearchController): public route, optional identity, anonymous
 * fallback for company context — never a new auth mechanism.
 */
@ApiTags('Catalog Classification')
@Controller('catalog')
@Throttle({ default: { limit: 30, ttl: 60000 } })
export class CatalogClassifyController {
  constructor(private readonly classifyService: CatalogClassifyService) {}

  @Post('classify')
  @ApiOperation({ summary: 'Classify a product/service into canonical taxonomy IDs' })
  @HttpCode(HttpStatus.OK)
  @Public()
  async classify(
    @Body() dto: ClassifyCatalogDto,
    @Req() req: RequestWithUser,
  ): Promise<ClassifyCatalogResponse> {
    // Identity is optional (buyer discovery); sellers pass JWT and get
    // credit-attributed calls. Mirrors AiSearchController convention.
    const companyId = req.user?.companyId || req.user?.id || 'anonymous';
    const userId = req.user?.id;
    return this.classifyService.classify(dto, companyId, userId);
  }

  @Post('classify/authenticated')
  @ApiOperation({ summary: 'Classify with authenticated company context (credit-attributed)' })
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  async classifyAuthenticated(
    @Body() dto: ClassifyCatalogDto,
    @Req() req: RequestWithUser,
  ): Promise<ClassifyCatalogResponse> {
    const companyId = req.user?.companyId || req.user?.id || 'anonymous';
    return this.classifyService.classify(dto, companyId, req.user?.id);
  }
}
