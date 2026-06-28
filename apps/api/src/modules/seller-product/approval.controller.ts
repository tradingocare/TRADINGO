import { Controller, Get, Post, Param, Query, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { ApprovalService } from './approval.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Admin Product Approval')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('admin/products/approval')
export class ApprovalController {
  constructor(private readonly service: ApprovalService) {}

  @Get()
  @Roles('ADMIN', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'List pending approval products' })
  getPending(@Query('page') page?: string, @Query('limit') limit?: string) {
    return this.service.getPendingProducts(page ? Number(page) : undefined, limit ? Number(limit) : undefined);
  }

  @Post(':id/approve')
  @Roles('ADMIN', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Approve product' })
  approve(@Param('id') id: string, @CurrentUser('sub') userId: string, @Body('reason') reason?: string) {
    return this.service.approveProduct(id, userId, reason);
  }

  @Post(':id/reject')
  @Roles('ADMIN', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Reject product with reason' })
  reject(@Param('id') id: string, @CurrentUser('sub') userId: string, @Body('reason') reason: string) {
    return this.service.rejectProduct(id, userId, reason);
  }

  @Get('audit')
  @Roles('ADMIN', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Approval audit trail' })
  getAudit(@Query('page') page?: string, @Query('limit') limit?: string) {
    return this.service.getAuditTrail(page ? Number(page) : undefined, limit ? Number(limit) : undefined);
  }
}
