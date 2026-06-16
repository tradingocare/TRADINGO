import { Controller, Get, Query, UseGuards } from '@nestjs/common';
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
}
