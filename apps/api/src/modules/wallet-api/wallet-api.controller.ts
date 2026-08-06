import { Controller, Get, Post, Body, Param, Query, UseGuards, Req, Res, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { WalletApiService } from './wallet-api.service';
import { WalletSearchDto, LedgerSearchDto, StatementQueryDto, ManualCreditDto, ManualDebitDto, ReverseTransactionDto } from './dto';
import { RolesGuard } from '../../common/guards/roles.guard';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@ApiTags('Wallet API')
@Controller('wallet')
@UseGuards(JwtAuthGuard, RolesGuard)
@Throttle({ default: { limit: 60, ttl: 60000 } })
export class WalletApiController {
  constructor(private readonly walletApi: WalletApiService) {}

  // ─── Buyer ─────────────────────────────────────────────────

  @Get('buyer/summary')
  @ApiOperation({ summary: 'Get buyer wallet summary' })
  getBuyerSummary(@Req() req: any) {
    return this.walletApi.getBuyerWallet(req.user.sub);
  }

  @Get('buyer/balance')
  @ApiOperation({ summary: 'Get buyer balance' })
  getBuyerBalance(@Req() req: any) {
    return this.walletApi.getBuyerBalance(req.user.sub);
  }

  @Get('buyer/transactions')
  @ApiOperation({ summary: 'Get buyer transactions' })
  getBuyerTransactions(@Req() req: any, @Query() query: LedgerSearchDto) {
    return this.walletApi.getBuyerTransactions(req.user.sub, query);
  }

  @Get('buyer/rewards')
  @ApiOperation({ summary: 'Get buyer rewards' })
  getBuyerRewards(@Req() req: any, @Query() query: { page?: number; limit?: number }) {
    return this.walletApi.getBuyerRewards(req.user.sub, query);
  }

  @Get('buyer/statement')
  @ApiOperation({ summary: 'Get buyer statement' })
  getBuyerStatement(@Req() req: any, @Query() query: StatementQueryDto) {
    return this.walletApi.getBuyerStatement(req.user.sub, query);
  }

  // ─── Seller ────────────────────────────────────────────────

  @Get('seller/summary')
  @ApiOperation({ summary: 'Get seller wallet summary' })
  getSellerSummary(@Req() req: any) {
    return this.walletApi.getSellerWallet(req.user.sub);
  }

  @Get('seller/transactions')
  @ApiOperation({ summary: 'Get seller transactions' })
  getSellerTransactions(@Req() req: any, @Query() query: LedgerSearchDto) {
    return this.walletApi.getSellerTransactions(req.user.sub, query);
  }

  @Get('seller/statement')
  @ApiOperation({ summary: 'Get seller statement' })
  getSellerStatement(@Req() req: any, @Query() query: StatementQueryDto) {
    return this.walletApi.getSellerStatement(req.user.sub, query);
  }

  @Get('seller/analytics')
  @ApiOperation({ summary: 'Get seller analytics' })
  getSellerAnalytics(@Req() req: any) {
    return this.walletApi.getSellerAnalytics(req.user.sub);
  }

  // ─── Admin ─────────────────────────────────────────────────

  @Get('admin/wallets')
  @ApiOperation({ summary: 'Search wallets' })
  @Roles('ADMIN')
  adminSearchWallets(@Query() query: WalletSearchDto) {
    return this.walletApi.adminSearchWallets(query);
  }

  @Get('admin/wallets/:walletId')
  @ApiOperation({ summary: 'Get wallet detail' })
  @Roles('ADMIN')
  adminGetWalletDetail(@Param('walletId') walletId: string) {
    return this.walletApi.adminGetWalletDetail(walletId);
  }

  @Post('admin/wallets/:walletId/freeze')
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @ApiOperation({ summary: 'Freeze wallet' })
  @Roles('ADMIN')
  @HttpCode(HttpStatus.OK)
  adminFreezeWallet(@Param('walletId') walletId: string) {
    return this.walletApi.adminFreezeWallet(walletId);
  }

  @Post('admin/wallets/:walletId/unfreeze')
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @ApiOperation({ summary: 'Unfreeze wallet' })
  @Roles('ADMIN')
  @HttpCode(HttpStatus.OK)
  adminUnfreezeWallet(@Param('walletId') walletId: string) {
    return this.walletApi.adminUnfreezeWallet(walletId);
  }

  @Post('admin/credit')
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @ApiOperation({ summary: 'Manual credit' })
  @Roles('ADMIN')
  @HttpCode(HttpStatus.OK)
  adminManualCredit(@Body() dto: ManualCreditDto, @Req() req: any) {
    return this.walletApi.adminManualCredit(dto, req.user.sub);
  }

  @Post('admin/debit')
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @ApiOperation({ summary: 'Manual debit' })
  @Roles('ADMIN')
  @HttpCode(HttpStatus.OK)
  adminManualDebit(@Body() dto: ManualDebitDto, @Req() req: any) {
    return this.walletApi.adminManualDebit(dto, req.user.sub);
  }

  @Post('admin/adjust')
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @ApiOperation({ summary: 'Adjust wallet balance' })
  @Roles('ADMIN')
  @HttpCode(HttpStatus.OK)
  adminAdjustBalance(@Body() body: { walletId: string; amount: number; reason: string; notes?: string }, @Req() req: any) {
    return this.walletApi.adminAdjustBalance(body.walletId, body.amount, body.reason, body.notes, req.user.sub);
  }

  @Post('admin/reverse')
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @ApiOperation({ summary: 'Reverse transaction' })
  @Roles('ADMIN')
  @HttpCode(HttpStatus.OK)
  adminReverseTransaction(@Body() dto: ReverseTransactionDto, @Req() req: any) {
    return this.walletApi.adminReverseTransaction(dto, req.user.sub);
  }

  @Get('admin/ledger')
  @ApiOperation({ summary: 'Search ledger' })
  @Roles('ADMIN')
  adminSearchLedger(@Query() query: LedgerSearchDto) {
    return this.walletApi.adminSearchLedger(query);
  }

  @Get('admin/fraud-alerts')
  @ApiOperation({ summary: 'Get fraud alerts' })
  @Roles('ADMIN')
  adminGetFraudAlerts() {
    return this.walletApi.adminGetFraudAlerts();
  }

  @Get('admin/fraud-summary')
  @ApiOperation({ summary: 'Get fraud summary' })
  @Roles('ADMIN')
  adminGetFraudSummary() {
    return this.walletApi.getFraudSummary();
  }

  @Get('admin/wallets/:walletId/audit')
  @ApiOperation({ summary: 'Get wallet audit trail' })
  @Roles('ADMIN')
  adminGetWalletAudit(@Param('walletId') walletId: string) {
    return this.walletApi.adminGetWalletAudit(walletId);
  }

  // ─── Statements ────────────────────────────────────────────

  @Get('statement')
  @ApiOperation({ summary: 'Generate statement' })
  generateStatement(@Req() req: any, @Query() query: StatementQueryDto) {
    return this.walletApi.generateStatement(req.user.sub, query);
  }

  @Get('statement/csv')
  @ApiOperation({ summary: 'Export statement as CSV' })
  async exportCsv(@Req() req: any, @Query() query: StatementQueryDto, @Res() res: any) {
    const csv = await this.walletApi.exportCsv(req.user.sub, query);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="gocash-statement-${query.period ?? 'custom'}.csv"`);
    res.send(csv);
  }

  // ─── Analytics ─────────────────────────────────────────────

  @Get('analytics/growth')
  @ApiOperation({ summary: 'Get growth analytics' })
  @Roles('ADMIN')
  getGrowthAnalytics() {
    return this.walletApi.getGrowthAnalytics();
  }

  @Get('analytics/distribution')
  @ApiOperation({ summary: 'Get distribution analytics' })
  @Roles('ADMIN')
  getDistributionAnalytics() {
    return this.walletApi.getDistributionAnalytics();
  }

  @Get('analytics/top-wallets')
  @ApiOperation({ summary: 'Get top wallets' })
  @Roles('ADMIN')
  getTopWallets(@Query('limit') limit?: string) {
    return this.walletApi.getTopWallets(limit ? parseInt(limit, 10) : 10);
  }

  @Get('analytics/redemption-trends')
  @ApiOperation({ summary: 'Get redemption trends' })
  @Roles('ADMIN')
  getRedemptionTrends() {
    return this.walletApi.getRedemptionTrends();
  }
}
