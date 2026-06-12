import { Injectable, BadRequestException, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { GoCashTransactionType, GoCashRedemptionType } from '@prisma/client';

const GC_TO_INR_RATE = 10;
const MAX_REDEMPTION_PERCENT = 50;

@Injectable()
export class GoCashService {
  private readonly logger = new Logger(GoCashService.name);

  constructor(private readonly prisma: PrismaService) {}

  async getBalance(companyId: string) {
    const company = await this.prisma.company.findFirst({
      where: { id: companyId, deletedAt: null },
      select: { id: true, goCashBalance: true },
    });
    if (!company) throw new NotFoundException('Company not found');
    return { companyId, balance: company.goCashBalance, inrValue: company.goCashBalance / GC_TO_INR_RATE };
  }

  async getTransactions(companyId: string, limit = 50, cursor?: string) {
    const findArgs: Record<string, unknown> = {
      where: { companyId },
      orderBy: { createdAt: 'desc' as const },
      take: limit,
    };
    if (cursor) {
      findArgs.cursor = { id: cursor };
      findArgs.skip = 1;
    }
    const data = await this.prisma.goCashTransaction.findMany(findArgs as any);
    const total = await this.prisma.goCashTransaction.count({ where: { companyId } });
    return { data, meta: { total, limit, cursor: data.length > 0 ? data[data.length - 1].id : undefined } };
  }

  async addTransaction(companyId: string, userId: string | undefined, dto: CreateTransactionDto) {
    return this.prisma.$transaction(async (tx) => {
      const company = await tx.company.findFirst({
        where: { id: companyId, deletedAt: null },
        select: { id: true, goCashBalance: true },
      });
      if (!company) throw new NotFoundException('Company not found');

      const balanceChange = (dto.type === 'REDEEMED' || dto.type === 'ADMIN_DEBIT' || dto.type === 'EXPIRED')
        ? -dto.amount
        : dto.amount;

      const balanceAfter = company.goCashBalance + balanceChange;
      if (balanceAfter < 0) {
        throw new BadRequestException('Insufficient GOCASH balance');
      }

      const transaction = await tx.goCashTransaction.create({
        data: {
          companyId,
          userId,
          type: dto.type,
          amount: dto.amount,
          balanceBefore: company.goCashBalance,
          balanceAfter,
          reason: dto.reason,
          sourceModule: dto.sourceModule,
          redemptionType: dto.redemptionType,
          referenceId: dto.referenceId,
        },
      });

      await tx.company.update({
        where: { id: companyId },
        data: { goCashBalance: balanceAfter },
      });

      this.logger.log(`GoCash transaction: ${dto.type} ${dto.amount} for company ${companyId}`);
      return transaction;
    });
  }

  async redeem(companyId: string, userId: string, amount: number, redemptionType: GoCashRedemptionType, referenceId?: string) {
    const company = await this.prisma.company.findFirst({
      where: { id: companyId, deletedAt: null },
      select: { id: true, goCashBalance: true },
    });
    if (!company) throw new NotFoundException('Company not found');
    if (company.goCashBalance < amount) {
      throw new BadRequestException('Insufficient GOCASH balance');
    }

    return this.addTransaction(companyId, userId, {
      type: 'REDEEMED',
      amount,
      redemptionType,
      referenceId,
      reason: `Redeemed ${amount} GC for ${redemptionType}`,
      sourceModule: 'GO_CASH_REDEMPTION',
    });
  }

  async adminCredit(companyId: string, amount: number, reason: string, adminUserId: string) {
    return this.addTransaction(companyId, adminUserId, {
      type: 'ADMIN_CREDIT',
      amount,
      reason,
      sourceModule: 'ADMIN',
    });
  }

  async adminDebit(companyId: string, amount: number, reason: string, adminUserId: string) {
    return this.addTransaction(companyId, adminUserId, {
      type: 'ADMIN_DEBIT',
      amount,
      reason,
      sourceModule: 'ADMIN',
    });
  }

  async getConversionRate() {
    return { gcToInr: GC_TO_INR_RATE, inrToGc: 1 / GC_TO_INR_RATE, maxRedemptionPercent: MAX_REDEMPTION_PERCENT };
  }

  canRedeem(balance: number, transactionValue: number): { allowed: boolean; maxRedeemable: number } {
    const maxRedeemable = Math.min(balance, Math.floor((transactionValue * MAX_REDEMPTION_PERCENT) / 100));
    return { allowed: maxRedeemable > 0 && balance >= maxRedeemable, maxRedeemable };
  }
}
