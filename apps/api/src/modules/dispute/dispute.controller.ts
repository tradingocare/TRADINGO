import { Controller, Get, Post, Patch, Param, Body, Query, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { DisputeService } from './dispute.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CompanyOwnerGuard } from '../../common/guards/company-owner.guard';
import {
  CreateDisputeDto, UpdateDisputeStatusDto, AddMessageDto, AddEvidenceDto,
  ResolveDisputeDto, AppealDisputeDto, ReviewAppealDto, QueryDisputeDto, EscalateDisputeDto,
} from './dto/dispute.dto';

@ApiTags('Disputes')
@UseGuards(JwtAuthGuard, CompanyOwnerGuard)
@Controller('companies/:companyId/disputes')
export class DisputeController {
  constructor(private readonly disputeService: DisputeService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new dispute' })
  async create(
    @Param('companyId') companyId: string,
    @Req() req: any,
    @Body() dto: CreateDisputeDto,
  ) {
    return this.disputeService.create(companyId, req.user.sub, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List disputes for company' })
  async findAll(
    @Param('companyId') companyId: string,
    @Query() query: QueryDisputeDto,
  ) {
    return this.disputeService.findAll(companyId, query);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get dispute analytics stats' })
  async getStats(@Param('companyId') companyId: string) {
    return this.disputeService.getStats(companyId);
  }

  @Get(':disputeId')
  @ApiOperation({ summary: 'Get dispute by ID' })
  async getDispute(
    @Param('companyId') companyId: string,
    @Param('disputeId') disputeId: string,
  ) {
    return this.disputeService.getDispute(disputeId, companyId);
  }

  @Patch(':disputeId/status')
  @ApiOperation({ summary: 'Update dispute status' })
  async updateStatus(
    @Param('companyId') companyId: string,
    @Param('disputeId') disputeId: string,
    @Req() req: any,
    @Body() dto: UpdateDisputeStatusDto,
  ) {
    return this.disputeService.updateStatus(disputeId, companyId, req.user.sub, dto);
  }

  @Post(':disputeId/messages')
  @ApiOperation({ summary: 'Add message to dispute' })
  async addMessage(
    @Param('companyId') companyId: string,
    @Param('disputeId') disputeId: string,
    @Req() req: any,
    @Body() dto: AddMessageDto,
  ) {
    return this.disputeService.addMessage(disputeId, companyId, req.user.sub, dto);
  }

  @Post(':disputeId/evidence')
  @ApiOperation({ summary: 'Add evidence to dispute' })
  async addEvidence(
    @Param('companyId') companyId: string,
    @Param('disputeId') disputeId: string,
    @Req() req: any,
    @Body() dto: AddEvidenceDto,
  ) {
    return this.disputeService.addEvidence(disputeId, companyId, req.user.sub, dto);
  }

  @Post(':disputeId/escalate')
  @ApiOperation({ summary: 'Escalate dispute to admin' })
  async escalate(
    @Param('companyId') companyId: string,
    @Param('disputeId') disputeId: string,
    @Req() req: any,
    @Body() dto: EscalateDisputeDto,
  ) {
    return this.disputeService.escalate(disputeId, companyId, req.user.sub, dto);
  }

  @Post(':disputeId/resolve')
  @ApiOperation({ summary: 'Admin resolve dispute' })
  async resolveDispute(
    @Param('companyId') companyId: string,
    @Param('disputeId') disputeId: string,
    @Req() req: any,
    @Body() dto: ResolveDisputeDto,
  ) {
    return this.disputeService.resolveDispute(disputeId, req.user.sub, dto);
  }

  @Post(':disputeId/appeal')
  @ApiOperation({ summary: 'Appeal a resolved/rejected dispute' })
  async appeal(
    @Param('companyId') companyId: string,
    @Param('disputeId') disputeId: string,
    @Req() req: any,
    @Body() dto: AppealDisputeDto,
  ) {
    return this.disputeService.appeal(disputeId, companyId, req.user.sub, dto);
  }

  @Post(':disputeId/review-appeal')
  @ApiOperation({ summary: 'Admin review dispute appeal' })
  async reviewAppeal(
    @Param('companyId') companyId: string,
    @Param('disputeId') disputeId: string,
    @Req() req: any,
    @Body() dto: ReviewAppealDto,
  ) {
    return this.disputeService.reviewAppeal(disputeId, req.user.sub, dto);
  }
}
