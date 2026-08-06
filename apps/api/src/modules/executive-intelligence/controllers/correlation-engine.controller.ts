import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { CorrelationEngineService } from '../services/correlation-engine.service';
import { AllCorrelationsResponseDto, KpiCorrelationsResponseDto, CorrelationQueryDto } from '../dto/correlation-engine.dto';

@Controller('founder/intelligence/correlations')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('SUPER_ADMIN')
export class CorrelationEngineController {
  constructor(private readonly correlationEngine: CorrelationEngineService) {}

  @Get()
  async getAllCorrelations(@Query() query: CorrelationQueryDto): Promise<AllCorrelationsResponseDto> {
    if (query.kpiId || query.minStrength || query.limit) {
      return this.correlationEngine.getCorrelations(query);
    }
    return this.correlationEngine.getAllCorrelations();
  }

  @Get(':kpiId')
  async getCorrelationsFor(@Param('kpiId') kpiId: string): Promise<KpiCorrelationsResponseDto | null> {
    return this.correlationEngine.findCorrelationsFor(kpiId);
  }
}
