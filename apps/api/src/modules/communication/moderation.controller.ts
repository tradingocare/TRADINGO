import { Controller, Get, Patch, Post, Param, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { ModerationService } from './moderation.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Communication Hub — Moderation')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('SUPER_ADMIN', 'ADMIN')
@Controller('admin/communication')
export class ModerationController {
  constructor(private readonly service: ModerationService) {}

  @Get('reports')
  @ApiOperation({ summary: 'List reported messages' })
  getReportedMessages(@Query('status') status?: string, @Query('limit') limit?: string, @Query('offset') offset?: string) {
    return this.service.getReportedMessages(status, limit ? parseInt(limit) : 50, offset ? parseInt(offset) : 0);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get moderation stats' })
  getSpamStats() {
    return this.service.getSpamStats();
  }

  @Post('reports/:id/review')
  @ApiOperation({ summary: 'Review a report' })
  reviewReport(@CurrentUser('sub') userId: string, @Param('id') id: string, @Body('action') action: string) {
    return this.service.reviewReport(id, userId, action);
  }

  @Post('reports/:id/dismiss')
  @ApiOperation({ summary: 'Dismiss a report' })
  dismissReport(@CurrentUser('sub') userId: string, @Param('id') id: string) {
    return this.service.dismissReport(id, userId);
  }
}
