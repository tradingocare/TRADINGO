import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { BetaProgramService } from './beta-program.service';
import { TrackEventDto } from './dto/track-event.dto';
import { ReportErrorDto } from './dto/report-error.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Beta Tracking')
@Controller('beta-tracking')
export class BetaTrackingController {
  constructor(private readonly betaProgramService: BetaProgramService) {}

  @Post('events')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Track a usage event' })
  async trackEvent(
    @Body() dto: TrackEventDto,
    @CurrentUser('sub') userId: string,
    @Req() req: any,
  ) {
    return this.betaProgramService.trackEvent({
      ...dto,
      companyId: req.user.companyId,
      userId,
      ip: req.ip,
      userAgent: req.headers?.['user-agent'],
    });
  }

  @Get('events/stats')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get usage statistics' })
  async getUsageStats(
    @CurrentUser('sub') _userId: string,
    @Req() req: any,
    @Query('period') period?: string,
  ) {
    return this.betaProgramService.getUsageStats(req.user.companyId, period);
  }

  @Get('events/top')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get top events' })
  async getTopEvents(
    @Req() req: any,
    @Query('limit') limit?: string,
  ) {
    return this.betaProgramService.getTopEvents(req.user.companyId, limit ? parseInt(limit, 10) : undefined);
  }

  @Post('errors')
  @Public()
  @ApiOperation({ summary: 'Report an error (client-side capture)' })
  async reportError(
    @Body() dto: ReportErrorDto,
    @Req() req: any,
  ) {
    return this.betaProgramService.reportError({
      ...dto,
      companyId: req.user?.companyId,
      userId: req.user?.sub,
      ip: req.ip,
      userAgent: req.headers?.['user-agent'],
    });
  }

  @Get('errors')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List errors' })
  async getErrors(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('resolved') resolved?: string,
    @Query('type') type?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.betaProgramService.getErrors({
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
      resolved: resolved !== undefined ? resolved === 'true' : undefined,
      type,
      startDate,
      endDate,
    });
  }

  @Get('errors/stats')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get error statistics' })
  async getErrorStats() {
    return this.betaProgramService.getErrorStats();
  }

  @Patch('errors/:id/resolve')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Resolve an error' })
  async resolveError(@Param('id') id: string) {
    return this.betaProgramService.resolveError(id);
  }
}
