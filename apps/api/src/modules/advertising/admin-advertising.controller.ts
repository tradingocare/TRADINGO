import { Controller, Get, Post, Param, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { RateLimits } from '../../common/constants/rate-limits.const';
import { AdvertisingService } from './advertising.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AuthUser } from '../../common/types/auth.types';
import { QueryAdvertisingDto } from './dto';

@ApiTags('Advertising Admin')
@Throttle(RateLimits.ADMIN_WRITE)
@Controller('admin/advertising')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN', 'SUPER_ADMIN')
export class AdminAdvertisingController {
  constructor(private readonly advertisingService: AdvertisingService) {}

  @Get()
  @ApiOperation({ summary: 'List all advertisements' })
  async findAll(@Query() query: QueryAdvertisingDto) {
    return this.advertisingService.findAll(query);
  }

  @Get('dashboard')
  @ApiOperation({ summary: 'Get admin advertising dashboard' })
  async dashboard() {
    return this.advertisingService.getAdminDashboard();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get advertisement by ID' })
  async findOne(@Param('id') id: string) {
    return this.advertisingService.findById(id);
  }

  @Post(':id/approve')
  @ApiOperation({ summary: 'Approve advertisement' })
  async approve(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.advertisingService.approve(id, user.sub);
  }

  @Post(':id/reject')
  @ApiOperation({ summary: 'Reject advertisement' })
  async reject(@Param('id') id: string, @Body('reason') reason: string, @CurrentUser() user: AuthUser) {
    return this.advertisingService.reject(id, reason, user.sub);
  }

  @Post(':id/pause')
  @ApiOperation({ summary: 'Pause advertisement' })
  async pause(@Param('id') id: string) {
    return this.advertisingService.pause(id);
  }

  @Post(':id/resume')
  @ApiOperation({ summary: 'Resume advertisement' })
  async resume(@Param('id') id: string) {
    return this.advertisingService.resume(id);
  }

  @Post('process-expired')
  @ApiOperation({ summary: 'Process expired advertisements' })
  async processExpired() {
    return this.advertisingService.processExpired();
  }

  @Post('process-auto')
  @ApiOperation({ summary: 'Process automatic advertising actions' })
  async processAuto() {
    return this.advertisingService.processAutoActions();
  }
}
