import { Controller, Get, Post, Body, Param, Query, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CreditService } from './credit.service';
import { SetCreditLimitDto, UpdateCreditStatusDto, UpdateRiskLevelDto, QueryCreditDto, RequestCreditApprovalDto, ApproveCreditApprovalDto, RejectCreditApprovalDto } from './dto';

@Controller('finance/credit')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class CreditController {
  constructor(private readonly creditService: CreditService) {}

  @Get()
  @Roles('ADMIN', 'SUPER_ADMIN')
  list(@Query() query: QueryCreditDto) { return this.creditService.listCredits(query); }

  @Get('utilization')
  @Roles('ADMIN', 'SUPER_ADMIN')
  utilization() { return this.creditService.getUtilization(); }

  @Get(':companyId')
  get(@Param('companyId') companyId: string) { return this.creditService.getCredit(companyId); }

  @Post(':companyId/set-limit')
  @Roles('ADMIN', 'SUPER_ADMIN')
  setLimit(@Param('companyId') companyId: string, @Body() dto: SetCreditLimitDto, @Req() req: any) { return this.creditService.setCreditLimit(companyId, dto, req.user.id); }

  @Post(':companyId/status')
  @Roles('ADMIN', 'SUPER_ADMIN')
  updateStatus(@Param('companyId') companyId: string, @Body() dto: UpdateCreditStatusDto, @Req() req: any) { return this.creditService.updateStatus(companyId, dto, req.user.id); }

  @Post(':companyId/risk-level')
  @Roles('ADMIN', 'SUPER_ADMIN')
  updateRisk(@Param('companyId') companyId: string, @Body() dto: UpdateRiskLevelDto, @Req() req: any) { return this.creditService.updateRiskLevel(companyId, dto, req.user.id); }

  @Get(':companyId/history')
  history(@Param('companyId') companyId: string) { return this.creditService.getCreditHistory(companyId); }

  @Post(':companyId/approval-request')
  requestApproval(@Param('companyId') companyId: string, @Body() dto: RequestCreditApprovalDto, @Req() req: any) { return this.creditService.requestApproval(companyId, dto, req.user.id); }

  @Get(':companyId/approvals')
  listApprovals(@Param('companyId') companyId: string) { return this.creditService.listApprovals(companyId); }
}

@Controller('finance/credit-approvals')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles('ADMIN', 'SUPER_ADMIN')
export class CreditApprovalController {
  constructor(private readonly creditService: CreditService) {}

  @Get()
  list(@Query() query: any) { return this.creditService.listAllApprovals(query); }

  @Post(':id/approve')
  approve(@Param('id') id: string, @Body() dto: ApproveCreditApprovalDto, @Req() req: any) { return this.creditService.approveApproval(id, dto, req.user.id); }

  @Post(':id/reject')
  reject(@Param('id') id: string, @Body() dto: RejectCreditApprovalDto, @Req() req: any) { return this.creditService.rejectApproval(id, dto, req.user.id); }
}
