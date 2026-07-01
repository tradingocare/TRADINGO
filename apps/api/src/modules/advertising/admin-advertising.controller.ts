import { Controller, Get, Post, Param, Body, Query, UseGuards } from '@nestjs/common';
import { AdvertisingService } from './advertising.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { QueryAdvertisingDto } from './dto';

@Controller('admin/advertising')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN', 'SUPER_ADMIN')
export class AdminAdvertisingController {
  constructor(private readonly advertisingService: AdvertisingService) {}

  @Get()
  async findAll(@Query() query: QueryAdvertisingDto) {
    return this.advertisingService.findAll(query);
  }

  @Get('dashboard')
  async dashboard() {
    return this.advertisingService.getAdminDashboard();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.advertisingService.findById(id);
  }

  @Post(':id/approve')
  async approve(@Param('id') id: string, @CurrentUser() user: any) {
    return this.advertisingService.approve(id, user.sub);
  }

  @Post(':id/reject')
  async reject(@Param('id') id: string, @Body('reason') reason: string, @CurrentUser() user: any) {
    return this.advertisingService.reject(id, reason, user.sub);
  }

  @Post(':id/pause')
  async pause(@Param('id') id: string) {
    return this.advertisingService.pause(id);
  }

  @Post(':id/resume')
  async resume(@Param('id') id: string) {
    return this.advertisingService.resume(id);
  }

  @Post('process-expired')
  async processExpired() {
    return this.advertisingService.processExpired();
  }

  @Post('process-auto')
  async processAuto() {
    return this.advertisingService.processAutoActions();
  }
}
