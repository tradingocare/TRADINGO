import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { RateLimits } from '../../common/constants/rate-limits.const';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { FinanceDashboardService } from './finance-dashboard.service';
import { QueryFinanceDashboardDto } from './dto';

@ApiTags('Finance Dashboard')
@Throttle(RateLimits.ADMIN_ANALYTICS)
@Controller('finance/dashboard')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles('ADMIN', 'SUPER_ADMIN')
export class FinanceDashboardController {
  constructor(private readonly dashboardService: FinanceDashboardService) {}

  @Get()
  @ApiOperation({ summary: 'Get finance dashboard' })
  dashboard(@Query() query: QueryFinanceDashboardDto) { return this.dashboardService.getDashboard(query); }

  @Get('cash-flow')
  @ApiOperation({ summary: 'Get cash flow data' })
  cashFlow(@Query() query: QueryFinanceDashboardDto) { return this.dashboardService.getCashFlow(query); }
}
