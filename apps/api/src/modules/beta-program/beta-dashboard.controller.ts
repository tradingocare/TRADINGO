import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { BetaProgramService } from './beta-program.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RateLimits } from '../../common/constants/rate-limits.const';

@ApiTags('Beta Dashboard')
@Controller('beta-dashboard')
@UseGuards(JwtAuthGuard)
@Throttle(RateLimits.MARKETPLACE_READ)
@ApiBearerAuth()
export class BetaDashboardController {
  constructor(private readonly betaProgramService: BetaProgramService) {}

  @Get()
  @ApiOperation({ summary: 'Get full beta dashboard data' })
  async getDashboard(@Req() req: any) {
    return this.betaProgramService.getDashboard(req.user.companyId);
  }

  @Get('metrics')
  @ApiOperation({ summary: 'Get beta metrics' })
  async getMetrics(
    @Req() req: any,
    @Query('names') names?: string,
  ) {
    const nameList = names ? names.split(',') : undefined;
    return this.betaProgramService.getMetrics(req.user.companyId, nameList);
  }

  @Post('metrics')
  @ApiOperation({ summary: 'Record a beta metric' })
  async recordMetric(
    @Req() req: any,
    @Body('name') name: string,
    @Body('value') value: number,
    @Body('metadata') metadata?: Record<string, unknown>,
  ) {
    return this.betaProgramService.recordMetric(req.user.companyId, name, value, metadata);
  }
}
