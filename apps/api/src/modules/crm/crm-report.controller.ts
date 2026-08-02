import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { RateLimits } from '../../common/constants/rate-limits.const';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CrmReportService } from './crm-report.service';

@ApiTags('CRM Report')
@Throttle(RateLimits.REPORT_GENERATE)
@Controller('crm')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class CrmReportController {
  constructor(private readonly reportService: CrmReportService) {}

  @Get('reports/conversion')
  @ApiOperation({ summary: 'Get lead conversion report' })
  @Roles('ADMIN', 'SUPER_ADMIN')
  leadConversion() {
    return this.reportService.leadConversion();
  }

  @Get('reports/win-rate')
  @ApiOperation({ summary: 'Get win rate report' })
  @Roles('ADMIN', 'SUPER_ADMIN')
  winRate() {
    return this.reportService.winRate();
  }

  @Get('reports/lost-reasons')
  @ApiOperation({ summary: 'Get lost reasons report' })
  @Roles('ADMIN', 'SUPER_ADMIN')
  lostReasons() {
    return this.reportService.lostReasons();
  }

  @Get('reports/pipeline-value')
  @ApiOperation({ summary: 'Get pipeline value report' })
  @Roles('ADMIN', 'SUPER_ADMIN')
  pipelineValue() {
    return this.reportService.pipelineValue();
  }

  @Get('reports/follow-up-efficiency')
  @ApiOperation({ summary: 'Get follow-up efficiency report' })
  @Roles('ADMIN', 'SUPER_ADMIN')
  followUpEfficiency() {
    return this.reportService.followUpEfficiency();
  }

  @Get('reports/rm-performance')
  @ApiOperation({ summary: 'Get RM performance report' })
  @Roles('ADMIN', 'SUPER_ADMIN')
  rmPerformance() {
    return this.reportService.rmPerformance();
  }

  @Get('reports/response-time')
  @ApiOperation({ summary: 'Get response time report' })
  @Roles('ADMIN', 'SUPER_ADMIN')
  responseTime() {
    return this.reportService.responseTime();
  }
}
