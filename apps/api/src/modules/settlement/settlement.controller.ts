import { Controller, Get, Post, Param, Body, Query, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { SettlementService } from './settlement.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CompanyOwnerGuard } from '../../common/guards/company-owner.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { CreateSettlementDto, QuerySettlementDto } from './dto/settlement.dto';

@ApiTags('Settlements')
@UseGuards(JwtAuthGuard, CompanyOwnerGuard)
@Controller('companies/:companyId/settlements')
export class SettlementController {
  constructor(private readonly settlementService: SettlementService) {}

  @Post()
  @ApiOperation({ summary: 'Create a settlement for a released escrow' })
  async create(
    @Param('companyId') companyId: string,
    @Body() dto: CreateSettlementDto,
    @CurrentUser('sub') userId: string,
  ) {
    return this.settlementService.create(dto.escrowId, companyId, userId);
  }

  @Get()
  @ApiOperation({ summary: 'List settlements for company' })
  async findAll(
    @Param('companyId') companyId: string,
    @Query() query: QuerySettlementDto,
  ) {
    return this.settlementService.findAll(companyId, query);
  }

  @Get(':settlementId')
  @ApiOperation({ summary: 'Get settlement details' })
  async getSettlement(
    @Param('companyId') companyId: string,
    @Param('settlementId') settlementId: string,
  ) {
    return this.settlementService.getSettlement(settlementId, companyId);
  }

  @Post(':settlementId/process')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Process a settlement' })
  async process(
    @Param('settlementId') settlementId: string,
    @CurrentUser('sub') userId: string,
  ) {
    return this.settlementService.process(settlementId, userId);
  }

  @Post(':settlementId/fail')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Mark a settlement as failed' })
  async fail(
    @Param('settlementId') settlementId: string,
    @Body('reason') reason: string,
    @CurrentUser('sub') userId: string,
  ) {
    return this.settlementService.fail(settlementId, reason, userId);
  }

  @Post(':settlementId/retry')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Retry a failed settlement' })
  async retry(
    @Param('settlementId') settlementId: string,
    @CurrentUser('sub') userId: string,
  ) {
    return this.settlementService.retry(settlementId, userId);
  }

  @Post(':settlementId/reopen')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reopen a settled or cancelled settlement' })
  async reopen(
    @Param('settlementId') settlementId: string,
    @CurrentUser('sub') userId: string,
  ) {
    return this.settlementService.reopen(settlementId, userId);
  }
}
