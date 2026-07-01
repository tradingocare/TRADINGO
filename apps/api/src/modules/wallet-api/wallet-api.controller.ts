import { Controller, Get, Post, Body, Param, Query, UseGuards, Req, Res, HttpCode, HttpStatus } from '@nestjs/common';
import { WalletApiService } from './wallet-api.service';
import { WalletSearchDto, LedgerSearchDto, StatementQueryDto, ManualCreditDto, ManualDebitDto, ReverseTransactionDto } from './dto';
import { RolesGuard } from '../../common/guards/roles.guard';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@Controller('wallet')
@UseGuards(JwtAuthGuard, RolesGuard)
export class WalletApiController {
  constructor(private readonly walletApi: WalletApiService) {}

  // ─── Buyer ─────────────────────────────────────────────────

  @Get('buyer/summary')
  getBuyerSummary(@Req() req: any) {
    return this.walletApi.getBuyerWallet(req.user.userId);
  }

  @Get('buyer/balance')
  getBuyerBalance(@Req() req: any) {
    return this.walletApi.getBuyerBalance(req.user.userId);
  }

  @Get('buyer/transactions')
  getBuyerTransactions(@Req() req: any, @Query() query: LedgerSearchDto) {
    return this.walletApi.getBuyerTransactions(req.user.userId, query);
  }

  @Get('buyer/rewards')
  getBuyerRewards(@Req() req: any, @Query() query: { page?: number; limit?: number }) {
    return this.walletApi.getBuyerRewards(req.user.userId, query);
  }

  @Get('buyer/statement')
  getBuyerStatement(@Req() req: any, @Query() query: StatementQueryDto) {
    return this.walletApi.getBuyerStatement(req.user.userId, query);
  }

  // ─── Seller ────────────────────────────────────────────────

  @Get('seller/summary')
  getSellerSummary(@Req() req: any) {
    return this.walletApi.getSellerWallet(req.user.userId);
  }

  @Get('seller/transactions')
  getSellerTransactions(@Req() req: any, @Query() query: LedgerSearchDto) {
    return this.walletApi.getSellerTransactions(req.user.userId, query);
  }

  @Get('seller/statement')
  getSellerStatement(@Req() req: any, @Query() query: StatementQueryDto) {
    return this.walletApi.getSellerStatement(req.user.userId, query);
  }

  @Get('seller/analytics')
  getSellerAnalytics(@Req() req: any) {
    return this.walletApi.getSellerAnalytics(req.user.userId);
  }

  // ─── Admin ─────────────────────────────────────────────────

  @Get('admin/wallets')
  @Roles('ADMIN')
  adminSearchWallets(@Query() query: WalletSearchDto) {
    return this.walletApi.adminSearchWallets(query);
  }

  @Get('admin/wallets/:walletId')
  @Roles('ADMIN')
  adminGetWalletDetail(@Param('walletId') walletId: string) {
    return this.walletApi.adminGetWalletDetail(walletId);
  }

  @Post('admin/wallets/:walletId/freeze')
  @Roles('ADMIN')
  @HttpCode(HttpStatus.OK)
  adminFreezeWallet(@Param('walletId') walletId: string) {
    return this.walletApi.adminFreezeWallet(walletId);
  }

  @Post('admin/wallets/:walletId/unfreeze')
  @Roles('ADMIN')
  @HttpCode(HttpStatus.OK)
  adminUnfreezeWallet(@Param('walletId') walletId: string) {
    return this.walletApi.adminUnfreezeWallet(walletId);
  }

  @Post('admin/credit')
  @Roles('ADMIN')
  @HttpCode(HttpStatus.OK)
  adminManualCredit(@Body() dto: ManualCreditDto, @Req() req: any) {
    return this.walletApi.adminManualCredit(dto, req.user.userId);
  }

  @Post('admin/debit')
  @Roles('ADMIN')
  @HttpCode(HttpStatus.OK)
  adminManualDebit(@Body() dto: ManualDebitDto, @Req() req: any) {
    return this.walletApi.adminManualDebit(dto, req.user.userId);
  }

  @Post('admin/adjust')
  @Roles('ADMIN')
  @HttpCode(HttpStatus.OK)
  adminAdjustBalance(@Body() body: { walletId: string; amount: number; reason: string; notes?: string }, @Req() req: any) {
    return this.walletApi.adminAdjustBalance(body.walletId, body.amount, body.reason, body.notes, req.user.userId);
  }

  @Post('admin/reverse')
  @Roles('ADMIN')
  @HttpCode(HttpStatus.OK)
  adminReverseTransaction(@Body() dto: ReverseTransactionDto, @Req() req: any) {
    return this.walletApi.adminReverseTransaction(dto, req.user.userId);
  }

  @Get('admin/ledger')
  @Roles('ADMIN')
  adminSearchLedger(@Query() query: LedgerSearchDto) {
    return this.walletApi.adminSearchLedger(query);
  }

  @Get('admin/fraud-alerts')
  @Roles('ADMIN')
  adminGetFraudAlerts() {
    return this.walletApi.adminGetFraudAlerts();
  }

  @Get('admin/fraud-summary')
  @Roles('ADMIN')
  adminGetFraudSummary() {
    return this.walletApi.getFraudSummary();
  }

  @Get('admin/wallets/:walletId/audit')
  @Roles('ADMIN')
  adminGetWalletAudit(@Param('walletId') walletId: string) {
    return this.walletApi.adminGetWalletAudit(walletId);
  }

  // ─── Statements ────────────────────────────────────────────

  @Get('statement')
  generateStatement(@Req() req: any, @Query() query: StatementQueryDto) {
    return this.walletApi.generateStatement(req.user.userId, query);
  }

  @Get('statement/csv')
  async exportCsv(@Req() req: any, @Query() query: StatementQueryDto, @Res() res: any) {
    const csv = await this.walletApi.exportCsv(req.user.userId, query);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="gocash-statement-${query.period ?? 'custom'}.csv"`);
    res.send(csv);
  }

  // ─── Analytics ─────────────────────────────────────────────

  @Get('analytics/growth')
  @Roles('ADMIN')
  getGrowthAnalytics() {
    return this.walletApi.getGrowthAnalytics();
  }

  @Get('analytics/distribution')
  @Roles('ADMIN')
  getDistributionAnalytics() {
    return this.walletApi.getDistributionAnalytics();
  }

  @Get('analytics/top-wallets')
  @Roles('ADMIN')
  getTopWallets(@Query('limit') limit?: string) {
    return this.walletApi.getTopWallets(limit ? parseInt(limit, 10) : 10);
  }

  @Get('analytics/redemption-trends')
  @Roles('ADMIN')
  getRedemptionTrends() {
    return this.walletApi.getRedemptionTrends();
  }
}
