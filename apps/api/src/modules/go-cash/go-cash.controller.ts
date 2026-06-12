import { Controller, Get, Post, Param, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { GoCashService } from './go-cash.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CompanyOwnerGuard } from '../../common/guards/company-owner.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { GoCashRedemptionType } from '@prisma/client';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';

@ApiTags('GoCash')
@UseGuards(JwtAuthGuard, CompanyOwnerGuard)
@Controller('companies/:companyId/go-cash')
export class GoCashController {
  constructor(private readonly goCashService: GoCashService) {}

  @Get('balance')
  @ApiOperation({ summary: 'Get GOCASH balance' })
  async getBalance(@Param('companyId') companyId: string) {
    return this.goCashService.getBalance(companyId);
  }

  @Get('transactions')
  @ApiOperation({ summary: 'Get transaction history' })
  async getTransactions(
    @Param('companyId') companyId: string,
    @Query('limit') limit?: number,
    @Query('cursor') cursor?: string,
  ) {
    return this.goCashService.getTransactions(companyId, limit, cursor);
  }

  @Post('transactions')
  @ApiOperation({ summary: 'Add transaction' })
  async addTransaction(
    @Param('companyId') companyId: string,
    @Body() dto: CreateTransactionDto,
    @CurrentUser('sub') userId: string,
  ) {
    return this.goCashService.addTransaction(companyId, userId, dto);
  }

  @Post('redeem')
  @ApiOperation({ summary: 'Redeem GOCASH' })
  async redeem(
    @Param('companyId') companyId: string,
    @Body('amount') amount: number,
    @Body('redemptionType') redemptionType: GoCashRedemptionType,
    @Body('referenceId') referenceId: string | undefined,
    @CurrentUser('sub') userId: string,
  ) {
    return this.goCashService.redeem(companyId, userId, amount, redemptionType, referenceId);
  }

  @Post('admin/credit')
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Admin credit GOCASH' })
  async adminCredit(
    @Param('companyId') companyId: string,
    @Body('amount') amount: number,
    @Body('reason') reason: string,
    @CurrentUser('sub') userId: string,
  ) {
    return this.goCashService.adminCredit(companyId, amount, reason, userId);
  }

  @Post('admin/debit')
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Admin debit GOCASH' })
  async adminDebit(
    @Param('companyId') companyId: string,
    @Body('amount') amount: number,
    @Body('reason') reason: string,
    @CurrentUser('sub') userId: string,
  ) {
    return this.goCashService.adminDebit(companyId, amount, reason, userId);
  }

  @Get('conversion-rate')
  @ApiOperation({ summary: 'Get conversion rate' })
  async getConversionRate() {
    return this.goCashService.getConversionRate();
  }
}
