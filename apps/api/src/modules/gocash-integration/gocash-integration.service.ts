import { Injectable, Logger } from '@nestjs/common';
import { GocashService } from '../gocash/gocash.service';
import { NotificationService } from '../notification/notification.service';
import { PrismaService } from '../../prisma/prisma.service';
import { GOCASH_REWARDS, INTEGRATION_SOURCE, SYSTEM_ACTOR, SYSTEM_ACTOR_TYPE } from './constants';

@Injectable()
export class GocashIntegrationService {
  private readonly logger = new Logger(GocashIntegrationService.name);

  constructor(
    private readonly gocashService: GocashService,
    private readonly prisma: PrismaService,
    private readonly notificationService: NotificationService,
  ) {}

  private async awardReward(params: {
    userId: string;
    companyId: string;
    amount: number;
    transactionType: string;
    reason: string;
    referenceId: string;
    referenceType: string;
    notificationType: string;
  }) {
    const wallet = await this.prisma.gOCASH_Wallet.findUnique({ where: { userId: params.userId } });
    if (!wallet) {
      this.logger.warn(`No wallet found for user ${params.userId}, skipping reward`);
      return null;
    }
    const idempotencyKey = `${params.referenceType}_${params.referenceId}_${params.userId}`;
    const existing = await this.gocashService.verifyIdempotency(idempotencyKey);
    if (existing) {
      this.logger.log(`Reward already processed for key ${idempotencyKey}`);
      return existing;
    }
    const txn = await this.gocashService.credit({
      walletId: wallet.id,
      amount: params.amount,
      type: params.transactionType as any,
      reason: params.reason,
      actorId: SYSTEM_ACTOR,
      actorType: SYSTEM_ACTOR_TYPE,
      referenceId: params.referenceId,
      referenceType: params.referenceType,
      sourceSystem: INTEGRATION_SOURCE,
      idempotencyKey,
    });
    try {
      await this.notificationService.createWithTemplate(
        params.companyId, params.userId, params.notificationType as any,
        { amount: params.amount, reason: params.reason },
      );
    } catch (e) {
      this.logger.warn(`Failed to send notification: ${(e as Error).message}`);
    }
    return txn;
  }

  async awardSignupBonus(userId: string, companyId: string) {
    return this.awardReward({
      userId, companyId,
      amount: GOCASH_REWARDS.MEMBERSHIP.SIGNUP_BONUS,
      transactionType: 'SIGNUP_BONUS',
      reason: 'Welcome! Signup bonus GOCASH credited.',
      referenceId: userId,
      referenceType: 'USER_SIGNUP',
      notificationType: 'GOCASH_REWARD',
    });
  }

  async awardPlanUpgradeBonus(userId: string, companyId: string, planId?: string) {
    return this.awardReward({
      userId, companyId,
      amount: GOCASH_REWARDS.MEMBERSHIP.PLAN_UPGRADE,
      transactionType: 'MEMBERSHIP_BONUS',
      reason: 'Plan upgrade reward!',
      referenceId: planId ?? userId,
      referenceType: 'PLAN_UPGRADE',
      notificationType: 'GOCASH_REWARD',
    });
  }

  async awardOrderCompleted(orderId: string, userId: string, companyId: string) {
    const count = await this.prisma.gOCASH_Transaction.count({
      where: { referenceType: 'ORDER_COMPLETED', referenceId: orderId },
    });
    let amount = GOCASH_REWARDS.ORDER.COMPLETED as number;
    const userOrderCount = await this.prisma.gOCASH_Transaction.count({
      where: { actorId: userId, referenceType: 'ORDER_COMPLETED' },
    });
    if (userOrderCount >= 100) amount = GOCASH_REWARDS.ORDER.MILESTONE_100;
    else if (userOrderCount >= 50) amount = GOCASH_REWARDS.ORDER.MILESTONE_50;
    else if (userOrderCount >= 10) amount = GOCASH_REWARDS.ORDER.MILESTONE_10;
    if (count > 0) return null;
    return this.awardReward({
      userId, companyId, amount,
      transactionType: 'SELLER_CASHBACK',
      reason: `Order completed reward.`,
      referenceId: orderId,
      referenceType: 'ORDER_COMPLETED',
      notificationType: 'GOCASH_EARNED',
    });
  }

  async awardRfqCreated(rfqId: string, userId: string, companyId: string) {
    return this.awardReward({
      userId, companyId,
      amount: GOCASH_REWARDS.RFQ.CREATED,
      transactionType: 'BUYER_CASHBACK',
      reason: 'RFQ created! Earned GOCASH.',
      referenceId: rfqId,
      referenceType: 'RFQ_CREATED',
      notificationType: 'GOCASH_EARNED',
    });
  }

  async awardQuoteAccepted(quoteId: string, buyerId: string, sellerId: string, companyId: string) {
    const buyerWallet = await this.prisma.gOCASH_Wallet.findUnique({ where: { userId: buyerId } });
    if (buyerWallet) {
      await this.awardReward({
        userId: buyerId, companyId,
        amount: GOCASH_REWARDS.QUOTE.ACCEPTED,
        transactionType: 'BUYER_CASHBACK',
        reason: 'Quote accepted! GOCASH earned.',
        referenceId: quoteId,
        referenceType: 'QUOTE_ACCEPTED_BUYER',
        notificationType: 'GOCASH_EARNED',
      });
    }
    return this.awardReward({
      userId: sellerId, companyId,
      amount: GOCASH_REWARDS.QUOTE.ACCEPTED,
      transactionType: 'SELLER_CASHBACK',
      reason: 'Your quote was accepted!',
      referenceId: quoteId,
      referenceType: 'QUOTE_ACCEPTED_SELLER',
      notificationType: 'GOCASH_EARNED',
    });
  }

  async awardNegotiationCompleted(negotiationId: string, userId: string, companyId: string) {
    return this.awardReward({
      userId, companyId,
      amount: GOCASH_REWARDS.NEGOTIATION.COMPLETED,
      transactionType: 'BUYER_CASHBACK',
      reason: 'Negotiation completed! GOCASH earned.',
      referenceId: negotiationId,
      referenceType: 'NEGOTIATION_COMPLETED',
      notificationType: 'GOCASH_EARNED',
    });
  }

  async awardPoConfirmed(poId: string, userId: string, companyId: string) {
    return this.awardReward({
      userId, companyId,
      amount: GOCASH_REWARDS.PO.CONFIRMED,
      transactionType: 'BUYER_CASHBACK',
      reason: 'Purchase Order confirmed!',
      referenceId: poId,
      referenceType: 'PO_CONFIRMED',
      notificationType: 'GOCASH_EARNED',
    });
  }

  async awardShipmentConfirmed(shipmentId: string, userId: string, companyId: string) {
    return this.awardReward({
      userId, companyId,
      amount: GOCASH_REWARDS.SHIPMENT.DELIVERED,
      transactionType: 'SELLER_CASHBACK',
      reason: 'Shipment confirmed! GOCASH earned.',
      referenceId: shipmentId,
      referenceType: 'SHIPMENT_CONFIRMED',
      notificationType: 'GOCASH_EARNED',
    });
  }

  async awardDeliveryConfirmed(deliveryId: string, userId: string, companyId: string) {
    return this.awardReward({
      userId, companyId,
      amount: GOCASH_REWARDS.DELIVERY.CONFIRMED,
      transactionType: 'BUYER_CASHBACK',
      reason: 'Delivery confirmed! GOCASH earned.',
      referenceId: deliveryId,
      referenceType: 'DELIVERY_CONFIRMED',
      notificationType: 'GOCASH_EARNED',
    });
  }

  async getIntegrationSummary(userId: string) {
    const txns = await this.prisma.gOCASH_Transaction.findMany({
      where: { actorId: userId, sourceSystem: INTEGRATION_SOURCE },
      orderBy: { createdAt: 'desc' },
    });
    const breakdown: Record<string, { count: number; total: number }> = {};
    for (const txn of txns) {
      const key = txn.referenceType ?? 'OTHER';
      if (!breakdown[key]) breakdown[key] = { count: 0, total: 0 };
      breakdown[key].count++;
      breakdown[key].total += Number(txn.amount);
    }
    return {
      totalRewards: txns.reduce((s, t) => s + Number(t.amount), 0),
      totalTransactions: txns.length,
      breakdown,
      recent: txns.slice(0, 20),
    };
  }
}
