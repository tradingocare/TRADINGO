import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { HealthIndexConsolidationService } from '../services/health-index-consolidation.service';
import { ConsolidatedHealthResponseDto, ConsolidatedHealthQueryDto } from '../dto/unified-health.dto';

@Controller('founder/intelligence/health/consolidated')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('SUPER_ADMIN')
export class UnifiedHealthController {
  constructor(
    private readonly healthIndexConsolidation: HealthIndexConsolidationService,
  ) {}

  @Get()
  async getConsolidatedHealth(@Query() query: ConsolidatedHealthQueryDto): Promise<ConsolidatedHealthResponseDto> {
    return this.healthIndexConsolidation.getConsolidatedHealth(query);
  }
}
