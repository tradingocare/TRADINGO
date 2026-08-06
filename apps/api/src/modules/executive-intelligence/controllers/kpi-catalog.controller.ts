import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { KpiCatalogService } from '../services/kpi-catalog.service';
import { KpiCatalogResponse, KpiSearchQueryDto, KpiDetailResponse } from '../dto/kpi-catalog.dto';

@Controller('founder/intelligence/kpis')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('SUPER_ADMIN')
export class KpiCatalogController {
  constructor(private readonly kpiCatalog: KpiCatalogService) {}

  @Get()
  async getAllKpis(@Query() query: KpiSearchQueryDto): Promise<KpiCatalogResponse> {
    if (query.domain || query.search || query.status) {
      return this.kpiCatalog.searchKpis(query);
    }
    return this.kpiCatalog.getAllKpis();
  }

  @Get('definitions')
  getDefinitions() {
    return this.kpiCatalog.getDefinitions();
  }

  @Get(':id')
  async getKpiDetail(@Param('id') id: string): Promise<KpiDetailResponse | null> {
    return this.kpiCatalog.getKpiDetail(id);
  }
}
