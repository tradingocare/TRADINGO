import { Controller, Get, Post, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { TradTrustService } from './tradtrust.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Public } from '../../common/decorators/public.decorator';
import { Roles } from '../../common/decorators/roles.decorator';

@ApiTags('TradTrust')
@Controller('tradtrust')
export class TradTrustController {
  constructor(private readonly tradTrustService: TradTrustService) {}

  @Get('score/:companyId')
  @Public()
  @ApiOperation({ summary: 'Get current trust score for a company (0-100 legacy)' })
  async getScore(@Param('companyId') companyId: string) {
    return this.tradTrustService.getScore(companyId);
  }

  @Get('unified/:companyId')
  @Public()
  @ApiOperation({ summary: 'Get unified trust score (0-1000) with grade and risk level' })
  async getUnifiedScore(@Param('companyId') companyId: string) {
    return this.tradTrustService.getUnifiedScore(companyId);
  }

  @Get('breakdown/:companyId')
  @Public()
  @ApiOperation({ summary: 'Get detailed score breakdown by category' })
  async getBreakdown(@Param('companyId') companyId: string) {
    return this.tradTrustService.getScoreBreakdown(companyId);
  }

  @Get('history/:companyId')
  @Public()
  @ApiOperation({ summary: 'Get trust score history for a company' })
  async getHistory(@Param('companyId') companyId: string, @Query('limit') limit?: number) {
    return this.tradTrustService.getHistory(companyId, limit);
  }

  @Get('stats')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get admin trust score statistics' })
  async getStats() {
    return this.tradTrustService.getTrustStats();
  }

  @Post('recalculate/:companyId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Recalculate trust score for a single company' })
  async recalculate(@Param('companyId') companyId: string) {
    const score = await this.tradTrustService.recalculateByCompany(companyId);
    return { companyId, score };
  }

  @Post('recalculate-all')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Recalculate trust scores for all companies' })
  async recalculateAll() {
    const count = await this.tradTrustService.recalculateAll();
    return { count };
  }

  @Post('recalculate-user/:userId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Recalculate trust score for a user company' })
  async recalculateByUser(@Param('userId') userId: string) {
    const result = await this.tradTrustService.recalculateByUser(userId);
    if (!result) return { message: 'User has no company' };
    return result;
  }
}
