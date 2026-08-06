import { Controller, Get, Post, Param, Query, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { GocashEcosystemService } from './gocash-ecosystem.service';
import { EcosystemMissionPeriod, EcosystemEntityStatus } from '@prisma/client';

@ApiTags('GOCASH Ecosystem')
@Controller('ecosystem')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Throttle({ default: { limit: 30, ttl: 60000 } })
export class GocashEcosystemController {
  constructor(private readonly service: GocashEcosystemService) {}

  @Get('dashboard')
  @ApiOperation({ summary: 'Get ecosystem dashboard' })
  async getDashboard(@Req() req: any) {
    return this.service.getDashboard(req.user.id, req.user.companyId);
  }

  @Get('xp/balance')
  @ApiOperation({ summary: 'Get XP balance' })
  async getXpBalance(@Req() req: any) {
    return this.service.getXpBalance(req.user.id);
  }

  @Get('xp/history')
  @ApiOperation({ summary: 'Get XP history' })
  async getXpHistory(@Req() req: any, @Query('page') page?: string, @Query('limit') limit?: string) {
    return this.service.getXpHistory(req.user.id, page ? parseInt(page) : 1, limit ? parseInt(limit) : 20);
  }

  @Post('checkin')
  @ApiOperation({ summary: 'Daily check-in' })
  async dailyCheckin(@Req() req: any) {
    return this.service.dailyCheckin(req.user.id, req.user.companyId);
  }

  @Get('checkin/history')
  @ApiOperation({ summary: 'Get check-in history' })
  async getCheckinHistory(@Req() req: any, @Query('month') month?: string, @Query('year') year?: string) {
    const now = new Date();
    return this.service.getDailyCheckinHistory(req.user.id, month ? parseInt(month) : now.getMonth() + 1, year ? parseInt(year) : now.getFullYear());
  }

  @Get('streaks')
  @ApiOperation({ summary: 'Get streaks' })
  async getStreaks(@Req() req: any) {
    return this.service.getStreaks(req.user.id);
  }

  @Get('levels')
  @ApiOperation({ summary: 'Get levels' })
  async getLevels() {
    return this.service.getLevels();
  }

  @Get('badges')
  @ApiOperation({ summary: 'Get badges' })
  async getBadges(@Query('includeInactive') includeInactive?: string) {
    return this.service.getBadges(includeInactive === 'true');
  }

  @Get('badges/mine')
  @ApiOperation({ summary: 'Get my badges' })
  async getUserBadges(@Req() req: any) {
    return this.service.getUserBadges(req.user.id);
  }

  @Get('missions')
  @ApiOperation({ summary: 'Get missions' })
  async getMissions(@Req() req: any, @Query('period') period?: EcosystemMissionPeriod) {
    return this.service.getMissions(req.user.id, period);
  }

  @Get('missions/mine')
  @ApiOperation({ summary: 'Get my missions' })
  async getUserMissions(@Req() req: any, @Query('status') status?: EcosystemEntityStatus) {
    return this.service.getUserMissions(req.user.id, status);
  }

  @Get('achievements')
  @ApiOperation({ summary: 'Get achievements' })
  async getAchievements(@Req() req: any) {
    return this.service.getAchievements(req.user.id);
  }

  @Get('achievements/mine')
  @ApiOperation({ summary: 'Get my achievements' })
  async getUserAchievements(@Req() req: any, @Query('status') status?: EcosystemEntityStatus) {
    return this.service.getUserAchievements(req.user.id, status);
  }

  @Get('ai-intelligence')
  @ApiOperation({ summary: 'Get AI intelligence' })
  async aiIntelligence(@Req() req: any) {
    return this.service.aiRewardIntelligence(req.user.id, req.user.companyId);
  }

  @Get('summary/:userId')
  @ApiOperation({ summary: 'Get user summary' })
  @Roles('ADMIN', 'SUPER_ADMIN')
  async getUserSummary(@Param('userId') userId: string) {
    return this.service.getUserSummary(userId);
  }
}
