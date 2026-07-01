import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../../common/guards/roles.guard';
import { RmFinanceService } from './rm-finance.service';

@Controller('finance/rm')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class RmFinanceController {
  constructor(private readonly rmFinanceService: RmFinanceService) {}

  @Get('dashboard')
  dashboard(@Req() req: any) { return this.rmFinanceService.getRmDashboard(req.user.id); }

  @Get('performance')
  performance(@Req() req: any) { return this.rmFinanceService.getCollectionPerformance(req.user.id); }
}
