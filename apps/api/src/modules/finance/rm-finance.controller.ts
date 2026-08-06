import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { RateLimits } from '../../common/constants/rate-limits.const';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../../common/guards/roles.guard';
import { RmFinanceService } from './rm-finance.service';

@ApiTags('Relationship Manager Finance')
@Throttle(RateLimits.ADMIN_ANALYTICS)
@Controller('finance/rm')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class RmFinanceController {
  constructor(private readonly rmFinanceService: RmFinanceService) {}

  @Get('dashboard')
  @ApiOperation({ summary: 'Get RM finance dashboard' })
  dashboard(@Req() req: any) { return this.rmFinanceService.getRmDashboard(req.user.id); }

  @Get('performance')
  @ApiOperation({ summary: 'Get collection performance' })
  performance(@Req() req: any) { return this.rmFinanceService.getCollectionPerformance(req.user.id); }
}
