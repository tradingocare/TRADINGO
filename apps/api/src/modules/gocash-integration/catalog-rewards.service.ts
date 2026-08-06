import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { GocashService } from '../../modules/gocash/gocash.service';
import { GOCASH_REWARDS, INTEGRATION_SOURCE } from './constants';

@Injectable()
export class CatalogRewardsService {
  private readonly logger = new Logger(CatalogRewardsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly gocash: GocashService,
  ) {}

  async rewardProductCreated(companyId: string, productId: string) {
    return this.award(companyId, productId, 'PRODUCT_CREATED', GOCASH_REWARDS.CATALOG.PRODUCT_CREATED);
  }

  async rewardProductPublished(companyId: string, productId: string) {
    return this.award(companyId, productId, 'PRODUCT_PUBLISHED', GOCASH_REWARDS.CATALOG.PRODUCT_PUBLISHED);
  }

  async rewardFirstPublish(companyId: string, productId: string) {
    return this.award(companyId, productId, 'FIRST_PUBLISH', GOCASH_REWARDS.CATALOG.FIRST_PUBLISH);
  }

  async rewardQuality70(companyId: string, productId: string) {
    return this.award(companyId, productId, 'QUALITY_SCORE_70', GOCASH_REWARDS.CATALOG.QUALITY_SCORE_70);
  }

  async rewardQuality90(companyId: string, productId: string) {
    return this.award(companyId, productId, 'QUALITY_SCORE_90', GOCASH_REWARDS.CATALOG.QUALITY_SCORE_90);
  }

  async rewardProfileCompleted(companyId: string, productId: string) {
    return this.award(companyId, productId, 'PROFILE_COMPLETED', GOCASH_REWARDS.CATALOG.PROFILE_COMPLETED);
  }

  async rewardAiUsed(companyId: string, referenceId: string) {
    return this.award(companyId, referenceId, 'AI_USED', GOCASH_REWARDS.CATALOG.AI_USED);
  }

  private async getWalletForCompany(companyId: string) {
    const owner = await this.prisma.companyOwner.findFirst({
      where: { companyId },
      select: { userId: true },
    });
    if (!owner) return null;
    return this.prisma.gOCASH_Wallet.findUnique({ where: { userId: owner.userId } });
  }

  private async getAdminUserId(): Promise<string> {
    const admin = await this.prisma.user.findFirst({ where: { role: 'ADMIN' as any }, select: { id: true } });
    return admin?.id || 'system';
  }

  private async award(companyId: string, referenceId: string, action: string, amount: number) {
    try {
      const wallet = await this.getWalletForCompany(companyId);
      if (!wallet) {
        this.logger.warn(`No wallet found for company ${companyId}, skipping ${action}`);
        return { rewarded: false, amount, action, reason: 'no wallet' };
      }
      const adminId = await this.getAdminUserId();
      const idempotencyKey = `CATALOG_${action}_${referenceId}_${companyId}`;
      await this.gocash.credit({
        walletId: wallet.id,
        amount,
        type: 'CATALOG_REWARD' as any,
        reason: `Catalog reward: ${action}`,
        actorId: adminId,
        actorType: 'SYSTEM',
        idempotencyKey,
        referenceId,
        referenceType: action,
        sourceType: INTEGRATION_SOURCE,
        sourceSystem: 'catalog-rewards',
        notes: `Auto-reward for ${action} on product ${referenceId}`,
      });
      this.logger.log(`Rewarded ${amount} GOCASH to company ${companyId} for ${action}`);
      return { rewarded: true, amount, action };
    } catch (err: any) {
      if (err?.message?.includes('idempotency')) return { rewarded: false, amount, action, reason: 'duplicate' };
      this.logger.error(`Failed to reward ${action} for ${companyId}: ${err.message}`);
      return { rewarded: false, amount, action, reason: err.message };
    }
  }
}