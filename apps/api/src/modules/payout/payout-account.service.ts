import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { CreatePayoutAccountDto, UpdatePayoutAccountDto } from './dto/payout.dto';
import Razorpay from 'razorpay';

@Injectable()
export class PayoutAccountService {
  private readonly logger = new Logger(PayoutAccountService.name);
  private readonly razorpay: Razorpay | null = null;

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {
    const keyId = this.configService.get<string>('razorpay.keyId', '');
    const keySecret = this.configService.get<string>('razorpay.keySecret', '');
    if (keyId && keySecret) {
      this.razorpay = new Razorpay({ key_id: keyId, key_secret: keySecret });
    }
  }

  async getAccount(companyId: string) {
    const account = await this.prisma.sellerPayoutAccount.findUnique({ where: { companyId } });
    if (!account) throw new NotFoundException('Payout account not found');
    return account;
  }

  async upsertAccount(companyId: string, dto: CreatePayoutAccountDto) {
    let fundAccountId = dto.fundAccountId;

    if (!fundAccountId && this.razorpay && dto.bankAccount && dto.ifscCode) {
      try {
        const fundAccount = await this.razorpay.fundAccount.create({
          customer_id: dto.contactId ?? '',
          account_type: 'bank_account',
          bank_account: {
            name: dto.accountHolderName ?? '',
            ifsc: dto.ifscCode,
            account_number: dto.bankAccount,
          },
        });
        fundAccountId = fundAccount.id;
        this.logger.log(`Razorpay fund account created: ${fundAccount.id}`);
      } catch (err) {
        this.logger.warn(`Failed to create Razorpay fund account: ${(err as Error).message}`);
      }
    }

    const account = await this.prisma.sellerPayoutAccount.upsert({
      where: { companyId },
      create: {
        companyId,
        bankAccount: dto.bankAccount,
        ifscCode: dto.ifscCode,
        upiId: dto.upiId,
        fundAccountId,
      },
      update: {
        bankAccount: dto.bankAccount,
        ifscCode: dto.ifscCode,
        upiId: dto.upiId,
        fundAccountId: fundAccountId ?? undefined,
      },
    });

    return account;
  }

  async updateAccount(companyId: string, dto: UpdatePayoutAccountDto) {
    const existing = await this.prisma.sellerPayoutAccount.findUnique({ where: { companyId } });
    if (!existing) throw new NotFoundException('Payout account not found');

    return this.prisma.sellerPayoutAccount.update({
      where: { companyId },
      data: dto,
    });
  }

  async verifyAccount(companyId: string) {
    const account = await this.prisma.sellerPayoutAccount.findUnique({ where: { companyId } });
    if (!account) throw new NotFoundException('Payout account not found');

    return this.prisma.sellerPayoutAccount.update({
      where: { companyId },
      data: { isVerified: true, verifiedAt: new Date() },
    });
  }

  async deleteAccount(companyId: string) {
    const account = await this.prisma.sellerPayoutAccount.findUnique({ where: { companyId } });
    if (!account) throw new NotFoundException('Payout account not found');
    await this.prisma.sellerPayoutAccount.delete({ where: { companyId } });
  }
}
