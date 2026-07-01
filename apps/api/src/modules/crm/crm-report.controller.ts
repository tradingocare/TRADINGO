import { Controller, Get, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CrmReportService } from './crm-report.service';

@Controller('crm')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class CrmReportController {
  constructor(private readonly reportService: CrmReportService) {}

  @Get('reports/conversion')
  @Roles('ADMIN', 'SUPER_ADMIN')
  leadConversion() {
    return this.reportService.leadConversion();
  }

  @Get('reports/win-rate')
  @Roles('ADMIN', 'SUPER_ADMIN')
  winRate() {
    return this.reportService.winRate();
  }

  @Get('reports/lost-reasons')
  @Roles('ADMIN', 'SUPER_ADMIN')
  lostReasons() {
    return this.reportService.lostReasons();
  }

  @Get('reports/pipeline-value')
  @Roles('ADMIN', 'SUPER_ADMIN')
  pipelineValue() {
    return this.reportService.pipelineValue();
  }

  @Get('reports/follow-up-efficiency')
  @Roles('ADMIN', 'SUPER_ADMIN')
  followUpEfficiency() {
    return this.reportService.followUpEfficiency();
  }

  @Get('reports/rm-performance')
  @Roles('ADMIN', 'SUPER_ADMIN')
  rmPerformance() {
    return this.reportService.rmPerformance();
  }

  @Get('reports/response-time')
  @Roles('ADMIN', 'SUPER_ADMIN')
  responseTime() {
    return this.reportService.responseTime();
  }
}
