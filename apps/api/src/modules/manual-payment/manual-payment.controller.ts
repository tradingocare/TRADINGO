import { Controller, Get, Post, Param, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { ManualPaymentService } from './manual-payment.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CompanyOwnerGuard } from '../../common/guards/company-owner.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import {
  CreateManualPaymentProofDto,
  VerifyManualPaymentProofDto,
  RejectManualPaymentProofDto,
  QueryManualPaymentProofDto,
} from './dto/manual-payment.dto';

@ApiTags('Manual Payments')
@UseGuards(JwtAuthGuard, CompanyOwnerGuard)
@Controller('companies/:companyId/manual-payments')
export class ManualPaymentController {
  constructor(private readonly manualPaymentService: ManualPaymentService) {}

  @Post()
  @ApiOperation({ summary: 'Submit manual payment proof' })
  async create(
    @Param('companyId') companyId: string,
    @CurrentUser('sub') userId: string,
    @Body() dto: CreateManualPaymentProofDto,
  ) {
    return this.manualPaymentService.create(companyId, userId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List manual payment proofs for a company' })
  async findAll(
    @Param('companyId') companyId: string,
    @Query() query: QueryManualPaymentProofDto,
  ) {
    return this.manualPaymentService.findAll(companyId, query);
  }

  @Get(':proofId')
  @ApiOperation({ summary: 'Get single manual payment proof' })
  async findOne(
    @Param('companyId') companyId: string,
    @Param('proofId') proofId: string,
  ) {
    return this.manualPaymentService.findOne(proofId, companyId);
  }
}

@ApiTags('Admin - Manual Payments')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN', 'SUPER_ADMIN')
@Controller('admin/manual-payments')
export class AdminManualPaymentController {
  constructor(private readonly manualPaymentService: ManualPaymentService) {}

  @Post(':proofId/verify')
  @ApiOperation({ summary: 'Admin verify a manual payment proof' })
  async verify(
    @Param('proofId') proofId: string,
    @CurrentUser('sub') adminId: string,
    @Body() dto: VerifyManualPaymentProofDto,
  ) {
    return this.manualPaymentService.verify(proofId, adminId, dto);
  }

  @Post(':proofId/reject')
  @ApiOperation({ summary: 'Admin reject a manual payment proof' })
  async reject(
    @Param('proofId') proofId: string,
    @CurrentUser('sub') adminId: string,
    @Body() dto: RejectManualPaymentProofDto,
  ) {
    return this.manualPaymentService.reject(proofId, adminId, dto);
  }

  @Get('pending')
  @ApiOperation({ summary: 'Admin list all pending manual payment proofs' })
  async findAllPending(@Query() query: QueryManualPaymentProofDto) {
    return this.manualPaymentService.findAllPending(query);
  }
}
