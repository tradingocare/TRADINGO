import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';

export const PRODUCT_EVENTS = {
  CREATED: 'product.created',
  UPDATED: 'product.updated',
  PUBLISHED: 'product.published',
  UNPUBLISHED: 'product.unpublished',
  APPROVED: 'product.approved',
  REJECTED: 'product.rejected',
  QUALITY_UPDATED: 'product.quality.updated',
  AI_ENRICHED: 'product.ai.enriched',
  ADVERTISED: 'product.advertised',
  REWARDED: 'product.rewarded',
  NOTIFICATION_SENT: 'product.notification.sent',
} as const;

export interface ProductLifecycleEvent {
  productId: string;
  companyId: string;
  userId: string;
  timestamp: string;
  metadata?: Record<string, any>;
}

export interface QualityUpdatedEvent extends ProductLifecycleEvent {
  oldScore: number;
  newScore: number;
}

@Injectable()
export class EnterpriseCommerceEventService {
  constructor(private readonly eventEmitter: EventEmitter2) {}

  emitProductCreated(productId: string, companyId: string, userId: string, metadata?: Record<string, any>) {
    this.emit(PRODUCT_EVENTS.CREATED, { productId, companyId, userId, timestamp: new Date().toISOString(), metadata });
  }

  emitProductUpdated(productId: string, companyId: string, userId: string, metadata?: Record<string, any>) {
    this.emit(PRODUCT_EVENTS.UPDATED, { productId, companyId, userId, timestamp: new Date().toISOString(), metadata });
  }

  emitProductPublished(productId: string, companyId: string, userId: string, metadata?: Record<string, any>) {
    this.emit(PRODUCT_EVENTS.PUBLISHED, { productId, companyId, userId, timestamp: new Date().toISOString(), metadata });
  }

  emitProductUnpublished(productId: string, companyId: string, userId: string, metadata?: Record<string, any>) {
    this.emit(PRODUCT_EVENTS.UNPUBLISHED, { productId, companyId, userId, timestamp: new Date().toISOString(), metadata });
  }

  emitProductApproved(productId: string, companyId: string, userId: string, metadata?: Record<string, any>) {
    this.emit(PRODUCT_EVENTS.APPROVED, { productId, companyId, userId, timestamp: new Date().toISOString(), metadata });
  }

  emitProductRejected(productId: string, companyId: string, userId: string, metadata?: Record<string, any>) {
    this.emit(PRODUCT_EVENTS.REJECTED, { productId, companyId, userId, timestamp: new Date().toISOString(), metadata });
  }

  emitQualityUpdated(productId: string, companyId: string, userId: string, oldScore: number, newScore: number, metadata?: Record<string, any>) {
    this.emit(PRODUCT_EVENTS.QUALITY_UPDATED, { productId, companyId, userId, oldScore, newScore, timestamp: new Date().toISOString(), metadata });
  }

  emitAiEnriched(productId: string, companyId: string, userId: string, metadata?: Record<string, any>) {
    this.emit(PRODUCT_EVENTS.AI_ENRICHED, { productId, companyId, userId, timestamp: new Date().toISOString(), metadata });
  }

  emitProductAdvertised(productId: string, companyId: string, userId: string, metadata?: Record<string, any>) {
    this.emit(PRODUCT_EVENTS.ADVERTISED, { productId, companyId, userId, timestamp: new Date().toISOString(), metadata });
  }

  emitProductRewarded(productId: string, companyId: string, userId: string, metadata?: Record<string, any>) {
    this.emit(PRODUCT_EVENTS.REWARDED, { productId, companyId, userId, timestamp: new Date().toISOString(), metadata });
  }

  emitNotificationSent(productId: string, companyId: string, userId: string, metadata?: Record<string, any>) {
    this.emit(PRODUCT_EVENTS.NOTIFICATION_SENT, { productId, companyId, userId, timestamp: new Date().toISOString(), metadata });
  }

  private emit(event: string, payload: any) {
    this.eventEmitter.emit(event, payload);
  }
}