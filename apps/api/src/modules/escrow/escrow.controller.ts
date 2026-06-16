import { Controller, Get, Post, Param, Body, Query, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { EscrowService } from './escrow.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CompanyOwnerGuard } from '../../common/guards/company-owner.guard';
import { QueryEscrowDto } from './dto/escrow.dto';

@ApiTags('Escrow')
@UseGuards(JwtAuthGuard, CompanyOwnerGuard)
@Controller('companies/:companyId/escrow')
export class EscrowController {
  constructor(private readonly escrowService: EscrowService) {}

  @Post()
  @ApiOperation({ summary: 'Hold escrow for order' })
  async hold(
    @Param('companyId') companyId: string,
    @Body('orderId') orderId: string,
    @Req() req: any,
  ) {
    return this.escrowService.hold(orderId, companyId, req.user.sub);
  }

  @Get()
  @ApiOperation({ summary: 'List escrows for company' })
  async findAll(
    @Param('companyId') companyId: string,
    @Query() query: QueryEscrowDto,
  ) {
    return this.escrowService.findAll(companyId, query);
  }

  @Get('dashboard')
  @ApiOperation({ summary: 'Get seller dashboard' })
  async getSellerDashboard(@Param('companyId') companyId: string) {
    return this.escrowService.getSellerDashboard(companyId);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get escrow analytics stats' })
  async getStats(@Param('companyId') companyId: string) {
    return this.escrowService.getStats(companyId);
  }

  @Get(':escrowId')
  @ApiOperation({ summary: 'Get escrow by ID' })
  async getEscrow(
    @Param('companyId') companyId: string,
    @Param('escrowId') escrowId: string,
  ) {
    return this.escrowService.getEscrow(escrowId, companyId);
  }

  @Post(':escrowId/freeze')
  @ApiOperation({ summary: 'Freeze escrow' })
  async freeze(
    @Param('companyId') companyId: string,
    @Param('escrowId') escrowId: string,
    @Req() req: any,
  ) {
    return this.escrowService.freeze(escrowId, companyId, req.user.sub);
  }

  @Post(':escrowId/refund')
  @ApiOperation({ summary: 'Refund escrow' })
  async refund(
    @Param('companyId') companyId: string,
    @Param('escrowId') escrowId: string,
    @Req() req: any,
  ) {
    return this.escrowService.refund(escrowId, companyId, req.user.sub);
  }

  @Post(':escrowId/reopen')
  @ApiOperation({ summary: 'Reopen frozen escrow' })
  async reopen(
    @Param('companyId') companyId: string,
    @Param('escrowId') escrowId: string,
    @Req() req: any,
  ) {
    return this.escrowService.reopen(escrowId, companyId, req.user.sub);
  }
}
