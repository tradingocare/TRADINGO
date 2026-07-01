import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { Public } from '../../common/decorators/public.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { TradgoService } from './tradgo.service';

@ApiTags('TRADGO')
@Controller('tradgo')
export class TradgoController {
  constructor(private readonly tradgoService: TradgoService) {}

  @Get('races')
  @Public()
  @ApiOperation({ summary: 'Get TRADGO races' })
  async getRaces() {
    return this.tradgoService.getRaces();
  }

  @Get('badges')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get earned badges for current user company' })
  async getBadges(@CurrentUser('sub') userId: string) {
    const company = await this.tradgoService.getCompanyForUser(userId);
    return this.tradgoService.getBadges(company?.id);
  }

  @Get('leaderboard')
  @Public()
  @ApiOperation({ summary: 'Get TRADGO leaderboard' })
  async getLeaderboard(@Query('limit') limit?: number) {
    return this.tradgoService.getLeaderboard(limit);
  }

  @Get('unified-badges')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get unified badge registry for current user company' })
  async getUnifiedBadges(@CurrentUser('sub') userId: string) {
    const company = await this.tradgoService.getCompanyForUser(userId);
    return this.tradgoService.getUnifiedBadges(company?.id ?? userId);
  }

  @Get('trust-signals')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get aggregated trust signals for current user company' })
  async getTrustSignals(@CurrentUser('sub') userId: string) {
    const company = await this.tradgoService.getCompanyForUser(userId);
    return this.tradgoService.getTrustSignals(company?.id ?? userId);
  }

  @Get('unified-ranking')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get unified ranking for current user company' })
  async getUnifiedRanking(@CurrentUser('sub') userId: string) {
    const company = await this.tradgoService.getCompanyForUser(userId);
    if (!company) return { companyId: null, rank: null, totalEntries: 0, percentile: null };
    return this.tradgoService.getUnifiedRanking(company.id);
  }

  @Get('city-rankings/:city')
  @Public()
  @ApiOperation({ summary: 'Get top companies and products by city' })
  async getCityRankings(@Param('city') city: string, @Query('limit') limit?: number) {
    return this.tradgoService.getCityRankings(decodeURIComponent(city), limit);
  }

  @Get('state-rankings/:state')
  @Public()
  @ApiOperation({ summary: 'Get top companies and products by state' })
  async getStateRankings(@Param('state') state: string, @Query('limit') limit?: number) {
    return this.tradgoService.getStateRankings(decodeURIComponent(state), limit);
  }

  @Get('category-rankings/:categoryId')
  @Public()
  @ApiOperation({ summary: 'Get top products and companies by category' })
  async getCategoryRankings(@Param('categoryId') categoryId: string, @Query('limit') limit?: number) {
    return this.tradgoService.getCategoryRankings(categoryId, limit);
  }
}
