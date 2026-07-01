import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { ReputationService } from './reputation.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@ApiTags('Reputation')
@Controller('reputation')
export class ReputationController {
  constructor(private readonly reputationService: ReputationService) {}

  @Get('events/:userId')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get reputation events for a user' })
  async getEvents(@Param('userId') userId: string, @Query('limit') limit?: number) {
    return this.reputationService.getEvents(userId, limit);
  }

  @Get('summary/:userId')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get reputation summary for a user' })
  async getSummary(@Param('userId') userId: string) {
    return this.reputationService.getSummary(userId);
  }
}
