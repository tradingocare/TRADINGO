import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { RateLimits } from '../../common/constants/rate-limits.const';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CrmService } from './crm.service';

@ApiTags('CRM Admin')
@Throttle(RateLimits.ADMIN_ANALYTICS)
@Controller('admin/crm')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles('ADMIN', 'SUPER_ADMIN')
export class AdminCrmController {
  constructor(private readonly crmService: CrmService) {}

  @Get('dashboard')
  @ApiOperation({ summary: 'Get admin CRM dashboard' })
  adminDashboard() {
    return this.crmService.getAdminDashboard();
  }
}
