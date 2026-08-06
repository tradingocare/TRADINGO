import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { AuditLogService } from './audit-log.service';

@ApiTags('Audit Log')
@Controller('admin/audit-logs')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN', 'SUPER_ADMIN')
export class AuditLogController {
  constructor(private readonly auditLogService: AuditLogService) {}

  @Get()
  @ApiOperation({ summary: 'List audit logs' })
  findAll(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('search') search?: string,
    @Query('action') action?: string,
    @Query('resource') resource?: string,
    @Query('outcome') outcome?: string,
    @Query('correlationId') correlationId?: string,
    @Query('companyId') companyId?: string,
  ) {
    return this.auditLogService.findAll({
      page, limit, search, action, resource,
      outcome, correlationId, companyId,
    });
  }
}
