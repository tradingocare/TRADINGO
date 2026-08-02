import { Controller, Get, Post, Param, Body, Query, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { PayoutService } from './payout.service';
import { PayoutAccountService } from './payout-account.service';
import { QueryPayoutDto } from './dto/payout.dto';

@Throttle({ default: { limit: 120, ttl: 60000 } })
@Controller('admin/payouts')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN', 'SUPER_ADMIN')
export class PayoutAdminController {
  constructor(
    private readonly payoutService: PayoutService,
    private readonly payoutAccountService: PayoutAccountService,
  ) {}

  @Get()
  async listPayouts(@Query() query: QueryPayoutDto) {
    return this.payoutService.adminListPayouts(query);
  }

  @Get('stats')
  async getStats() {
    return this.payoutService.getStats();
  }

  @Get(':id')
  async getPayout(@Param('id') id: string) {
    return this.payoutService.getPayout(id);
  }

  @Post(':id/process')
  async processPayout(@Param('id') id: string) {
    return this.payoutService.processPayout(id);
  }

  @Post(':id/confirm')
  async confirmPayout(@Param('id') id: string, @Body() body: { gatewayPayoutId: string }) {
    return this.payoutService.confirmPayout(id, body.gatewayPayoutId);
  }

  @Post(':id/fail')
  async failPayout(@Param('id') id: string, @Body() body: { reason: string }) {
    return this.payoutService.failPayout(id, body.reason);
  }

  @Post('process-pending')
  async processPending() {
    return this.payoutService.processPendingPayouts();
  }

  @Get(':companyId/accounts')
  async getAccount(@Param('companyId') companyId: string) {
    return this.payoutAccountService.getAccount(companyId);
  }

  @Post(':companyId/accounts/verify')
  async verifyAccount(@Param('companyId') companyId: string) {
    return this.payoutAccountService.verifyAccount(companyId);
  }
}
