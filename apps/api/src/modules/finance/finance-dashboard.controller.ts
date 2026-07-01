import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { FinanceDashboardService } from './finance-dashboard.service';
import { QueryFinanceDashboardDto } from './dto';

@Controller('finance/dashboard')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles('ADMIN', 'SUPER_ADMIN')
export class FinanceDashboardController {
  constructor(private readonly dashboardService: FinanceDashboardService) {}

  @Get()
  dashboard(@Query() query: QueryFinanceDashboardDto) { return this.dashboardService.getDashboard(query); }

  @Get('cash-flow')
  cashFlow(@Query() query: QueryFinanceDashboardDto) { return this.dashboardService.getCashFlow(query); }
}
