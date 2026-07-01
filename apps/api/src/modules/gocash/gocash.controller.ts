import {
  Controller, Get, Post, Body, Param, Query, UseGuards, HttpCode, HttpStatus,
} from '@nestjs/common';
import { GocashService } from './gocash.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import {
  CreateWalletDto, CreditWalletDto, DebitWalletDto,
  RedeemDto, ReverseDto, RejectRedemptionDto,
  SearchQueryDto, LedgerQueryDto,
} from './dto';

@Controller('gocash')
@UseGuards(JwtAuthGuard, RolesGuard)
export class GocashController {
  constructor(private readonly gocashService: GocashService) {}

  @Post('wallets')
  @Roles('ADMIN')
  async createWallet(@Body() dto: CreateWalletDto) {
    return this.gocashService.createWallet(dto.userId, dto.companyId, dto.type, dto.kycVerified);
  }

  @Get('wallets/my')
  @Roles('BUYER', 'SELLER')
  async getMyWallet(@CurrentUser('sub') userId: string) {
    return this.gocashService.getWalletByUserId(userId);
  }

  @Get('wallets/:id')
  @Roles('ADMIN')
  async getWallet(@Param('id') id: string) {
    return this.gocashService.getBalance(id);
  }

  @Get('wallets/user/:userId')
  @Roles('ADMIN')
  async getWalletByUser(@Param('userId') userId: string) {
    return this.gocashService.getWalletByUserId(userId);
  }

  @Post('wallets/:id/credit')
  @Roles('ADMIN')
  async credit(@Param('id') walletId: string, @Body() dto: CreditWalletDto, @CurrentUser('sub') actorId: string) {
    return this.gocashService.credit({
      walletId,
      amount: dto.amount,
      type: dto.type,
      reason: dto.reason,
      actorId,
      actorType: 'ADMIN',
      referenceId: dto.referenceId,
      referenceType: dto.referenceType,
      sourceType: dto.sourceType,
      idempotencyKey: dto.idempotencyKey,
      notes: dto.notes,
    });
  }

  @Post('wallets/:id/debit')
  @Roles('ADMIN')
  async debit(@Param('id') walletId: string, @Body() dto: DebitWalletDto, @CurrentUser('sub') actorId: string) {
    return this.gocashService.debit({
      walletId,
      amount: dto.amount,
      type: dto.type,
      reason: dto.reason,
      actorId,
      actorType: 'ADMIN',
      referenceId: dto.referenceId,
      referenceType: dto.referenceType,
      sourceType: dto.sourceType,
      idempotencyKey: dto.idempotencyKey,
      notes: dto.notes,
    });
  }

  @Post('wallets/:id/redeem')
  @Roles('BUYER', 'SELLER')
  async redeem(@Param('id') walletId: string, @Body() dto: RedeemDto) {
    return this.gocashService.redeem(walletId, dto.amount, dto.redemptionType, dto.reference, dto.notes);
  }

  @Post('redemptions/:id/approve')
  @Roles('ADMIN')
  @HttpCode(HttpStatus.OK)
  async approveRedemption(@Param('id') id: string, @CurrentUser('sub') userId: string) {
    return this.gocashService.approveRedemption(id, userId);
  }

  @Post('redemptions/:id/reject')
  @Roles('ADMIN')
  @HttpCode(HttpStatus.OK)
  async rejectRedemption(@Param('id') id: string, @Body() dto: RejectRedemptionDto) {
    return this.gocashService.rejectRedemption(id, dto.reason);
  }

  @Post('transactions/:id/reverse')
  @Roles('ADMIN')
  async reverse(@Param('id') transactionId: string, @Body() dto: ReverseDto, @CurrentUser('sub') actorId: string) {
    return this.gocashService.reverse(transactionId, dto.reason, actorId, dto.notes);
  }

  @Get('wallets/:id/ledger')
  @Roles('BUYER', 'SELLER', 'ADMIN')
  async getLedger(@Param('id') walletId: string, @Query() query: LedgerQueryDto) {
    return this.gocashService.getLedger(walletId, query);
  }

  @Get('transactions/:id')
  @Roles('ADMIN')
  async getTransaction(@Param('id') id: string) {
    return this.gocashService.getTransaction(id);
  }

  @Get('admin/wallets')
  @Roles('ADMIN')
  async adminListWallets(@Query() query: SearchQueryDto) {
    return this.gocashService.adminListWallets(query);
  }

  @Get('admin/wallets/stats')
  @Roles('ADMIN')
  async adminGetWalletStats() {
    return this.gocashService.adminGetWalletStats();
  }

  @Get('admin/redemptions/:walletId')
  @Roles('ADMIN')
  async getRedemptions(@Param('walletId') walletId: string) {
    return this.gocashService.getRedemptions(walletId);
  }

  @Get('idempotency/:key')
  @Roles('ADMIN')
  async verifyIdempotency(@Param('key') key: string) {
    const entry = await this.gocashService.verifyIdempotency(key);
    return { exists: !!entry, transaction: entry ?? undefined };
  }
}
