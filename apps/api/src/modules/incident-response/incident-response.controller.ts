import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { IncidentResponseService } from './incident-response.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@ApiTags('Incident Response')
@Controller('admin/security')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN', 'SUPER_ADMIN')
export class IncidentResponseController {
  constructor(private readonly incidentResponse: IncidentResponseService) {}

  @Get('incidents')
  @ApiOperation({ summary: 'List security incidents' })
  async getIncidents(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('status') status?: string,
    @Query('severity') severity?: string,
  ) {
    return this.incidentResponse.getIncidents(page, limit, status, severity);
  }

  @Get('summary')
  @ApiOperation({ summary: 'Get incident response summary' })
  async getSummary() {
    return this.incidentResponse.getSummary();
  }
}
