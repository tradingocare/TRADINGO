import { Controller, Get, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CrmService } from './crm.service';

@Controller('admin/crm')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles('ADMIN', 'SUPER_ADMIN')
export class AdminCrmController {
  constructor(private readonly crmService: CrmService) {}

  @Get('dashboard')
  adminDashboard() {
    return this.crmService.getAdminDashboard();
  }
}
