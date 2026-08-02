import { Controller, Get, Put, Patch, Param, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { AdminSettingsService } from './admin-settings.service';

@ApiTags('Admin Settings')
@Controller('admin/settings')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN', 'SUPER_ADMIN')
export class AdminSettingsController {
  constructor(private readonly adminSettingsService: AdminSettingsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all admin settings' })
  getAll() {
    return this.adminSettingsService.getAll();
  }

  @Get(':key')
  @ApiOperation({ summary: 'Get admin setting by key' })
  get(@Param('key') key: string) {
    return this.adminSettingsService.get(key);
  }

  @Patch(':key')
  @ApiOperation({ summary: 'Update admin setting by key' })
  update(@Param('key') key: string, @Body('value') value: unknown) {
    return this.adminSettingsService.update(key, value);
  }

  @Patch()
  @ApiOperation({ summary: 'Batch update admin settings' })
  updateBatch(@Body() body: Record<string, unknown>) {
    return this.adminSettingsService.updateBatch(body);
  }
}
