import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { ClickhouseService, AnalyticsTable } from './clickhouse.service';

export interface AnalyticsEvent {
  companyId: string;
  eventType: string;
  metadata?: Record<string, unknown>;
  userId?: string;
  amount?: number;
  currency?: string;
  status?: string;
  [key: string]: unknown;
}

const BATCH_FLUSH_INTERVAL = 5000;
const BATCH_MAX_SIZE = 1000;

interface PendingBatch {
  table: AnalyticsTable;
  events: Record<string, unknown>[];
  timer: ReturnType<typeof setTimeout> | null;
}

@Injectable()
export class EventIngestionService {
  private readonly logger = new Logger(EventIngestionService.name);
  private batches = new Map<string, PendingBatch>();
  private deadLetterBuffer: Record<string, unknown>[] = [];

  constructor(
    private readonly clickhouse: ClickhouseService,
    @InjectQueue('analytics') private readonly analyticsQueue: Queue,
  ) {}

  async track(table: AnalyticsTable, event: AnalyticsEvent): Promise<void> {
    const row = this.toRow(table, event);
    this.addToBatch(table, row);
  }

  async trackBatch(table: AnalyticsTable, events: AnalyticsEvent[]): Promise<void> {
    for (const event of events) {
      const row = this.toRow(table, event);
      this.addToBatch(table, row);
    }
  }

  async flush(table?: AnalyticsTable): Promise<void> {
    if (table) {
      await this.flushTable(table);
    } else {
      const tables = Array.from(this.batches.keys());
      await Promise.all(tables.map((t) => this.flushTable(t as AnalyticsTable)));
    }
  }

  async flushDeadLetter(): Promise<void> {
    if (this.deadLetterBuffer.length === 0) return;
    const batch = this.deadLetterBuffer.splice(0);
    try {
      await this.analyticsQueue.add('process-dead-letter', { events: batch });
    } catch (err) {
      this.logger.error(`Failed to enqueue dead-letter batch: ${(err as Error).message}`);
    }
  }

  getBatchSize(table?: AnalyticsTable): number {
    if (table) {
      return this.batches.get(table)?.events.length ?? 0;
    }
    let total = 0;
    for (const batch of this.batches.values()) {
      total += batch.events.length;
    }
    return total;
  }

  getDeadLetterCount(): number {
    return this.deadLetterBuffer.length;
  }

  private toRow(table: AnalyticsTable, event: AnalyticsEvent): Record<string, unknown> {
    const row: Record<string, unknown> = {
      company_id: event.companyId,
      event_type: event.eventType,
      created_at: new Date().toISOString(),
    };

    if (event.userId) row.user_id = event.userId;
    if (event.metadata) row.metadata = JSON.stringify(event.metadata);
    if (event.amount !== undefined) row.amount = event.amount;
    if (event.currency) row.currency = event.currency;
    if (event.status) row.status = event.status;

    switch (table) {
      case 'rfq_analytics_events':
        if (event.rfqId) row.rfq_id = event.rfqId;
        break;
      case 'order_analytics_events':
        if (event.orderId) row.order_id = event.orderId;
        if (event.orderStatus) row.order_status = event.orderStatus;
        break;
      case 'chat_analytics_events':
        if (event.conversationId) row.conversation_id = event.conversationId;
        if (event.messageId) row.message_id = event.messageId;
        if (event.participantCount !== undefined) row.participant_count = event.participantCount;
        break;
      case 'notification_analytics_events':
        if (event.notificationId) row.notification_id = event.notificationId;
        if (event.channel) row.channel = event.channel;
        if (event.attemptCount !== undefined) row.attempt_count = event.attemptCount;
        break;
      case 'dispute_analytics_events':
        if (event.disputeId) row.dispute_id = event.disputeId;
        if (event.disputeStatus) row.dispute_status = event.disputeStatus;
        break;
      case 'payment_analytics_events':
        if (event.paymentId) row.payment_id = event.paymentId;
        if (event.gateway) row.gateway = event.gateway;
        break;
      case 'settlement_analytics_events':
        if (event.settlementId) row.settlement_id = event.settlementId;
        if (event.settlementStatus) row.settlement_status = event.settlementStatus;
        break;
      case 'gocash_analytics_events':
        if (event.transactionId) row.transaction_id = event.transactionId;
        if (event.transactionType) row.transaction_type = event.transactionType;
        if (event.balanceAfter !== undefined) row.balance_after = event.balanceAfter;
        break;
    }

    return row;
  }

  private addToBatch(table: AnalyticsTable, row: Record<string, unknown>): void {
    let batch = this.batches.get(table);
    if (!batch) {
      batch = { table, events: [], timer: null };
      this.batches.set(table, batch);
    }

    batch.events.push(row);

    if (batch.events.length >= BATCH_MAX_SIZE) {
      this.scheduleFlush(table);
    } else if (!batch.timer) {
      batch.timer = setTimeout(() => this.scheduleFlush(table), BATCH_FLUSH_INTERVAL);
    }
  }

  private async scheduleFlush(table: string): Promise<void> {
    const batch = this.batches.get(table);
    if (!batch || batch.events.length === 0) return;

    if (batch.timer) {
      clearTimeout(batch.timer);
      batch.timer = null;
    }

    const events = batch.events.splice(0);

    try {
      await this.clickhouse.insert(table as AnalyticsTable, events);
      this.logger.log(`Flushed ${events.length} events to ${table}`);
    } catch (err) {
      this.logger.error(`Failed to flush ${table}: ${(err as Error).message}`);
      this.deadLetterBuffer.push(...events.map((e) => ({ table, ...e })));

      if (this.deadLetterBuffer.length >= BATCH_MAX_SIZE) {
        await this.flushDeadLetter();
      }
    }
  }

  private async flushTable(table: AnalyticsTable): Promise<void> {
    const batch = this.batches.get(table);
    if (!batch || batch.events.length === 0) return;
    await this.scheduleFlush(table);
  }
}
