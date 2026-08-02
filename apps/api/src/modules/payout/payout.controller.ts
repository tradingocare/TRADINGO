import { Controller, Get, Post, Patch, Delete, Param, Body, Query, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { PayoutService } from './payout.service';
import { PayoutAccountService } from './payout-account.service';
import { CreatePayoutAccountDto, UpdatePayoutAccountDto, QueryPayoutDto } from './dto/payout.dto';

@Throttle({ default: { limit: 30, ttl: 60000 } })
@Controller()
export class PayoutController {
  constructor(
    private readonly payoutService: PayoutService,
    private readonly payoutAccountService: PayoutAccountService,
  ) {}

  @Get('payouts')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('BUYER', 'SELLER')
  async listPayouts(@CurrentUser() user: any, @Query() query: QueryPayoutDto) {
    const companyId = user.companyId;
    return this.payoutService.listPayouts(companyId, query);
  }

  @Get('payouts/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('BUYER', 'SELLER')
  async getPayout(@Param('id') id: string, @CurrentUser() user: any) {
    return this.payoutService.getPayout(id, user.companyId);
  }

  @Get('payout-accounts')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SELLER')
  async getAccount(@CurrentUser() user: any) {
    return this.payoutAccountService.getAccount(user.companyId);
  }

  @Post('payout-accounts')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SELLER')
  async upsertAccount(@CurrentUser() user: any, @Body() dto: CreatePayoutAccountDto) {
    return this.payoutAccountService.upsertAccount(user.companyId, dto);
  }

  @Patch('payout-accounts')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SELLER')
  async updateAccount(@CurrentUser() user: any, @Body() dto: UpdatePayoutAccountDto) {
    return this.payoutAccountService.updateAccount(user.companyId, dto);
  }

  @Delete('payout-accounts')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SELLER')
  async deleteAccount(@CurrentUser() user: any) {
    return this.payoutAccountService.deleteAccount(user.companyId);
  }
}
