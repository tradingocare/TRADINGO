import { Injectable, Logger, Inject } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { Gauge } from 'prom-client';
import { QueueNames } from '../../jobs/queues';
import { MetricsRegistryService } from './metrics-registry.service';

const ALL_QUEUES = [
  QueueNames.EMAIL, QueueNames.EXPORT, QueueNames.NOTIFICATION,
  QueueNames.CERTIFICATION, QueueNames.SUBSCRIPTION, QueueNames.RFQ,
  QueueNames.ESCROW, QueueNames.SETTLEMENT, QueueNames.DISPUTE,
  QueueNames.ANALYTICS, QueueNames.BESTSELLER, QueueNames.AI,
  QueueNames.TRACKING,
] as const;

@Injectable()
export class QueueMetricsService {
  private readonly logger = new Logger(QueueMetricsService.name);
  private interval: ReturnType<typeof setInterval> | null = null;
  private initialized = false;
  private queues: { name: string; queue: Queue }[] = [];

  constructor(
    private readonly registry: MetricsRegistryService,
    @InjectQueue(QueueNames.EMAIL) email: Queue,
    @InjectQueue(QueueNames.EXPORT) exp: Queue,
    @InjectQueue(QueueNames.NOTIFICATION) notification: Queue,
    @InjectQueue(QueueNames.CERTIFICATION) certification: Queue,
    @InjectQueue(QueueNames.SUBSCRIPTION) subscription: Queue,
    @InjectQueue(QueueNames.RFQ) rfq: Queue,
    @InjectQueue(QueueNames.ESCROW) escrow: Queue,
    @InjectQueue(QueueNames.SETTLEMENT) settlement: Queue,
    @InjectQueue(QueueNames.DISPUTE) dispute: Queue,
    @InjectQueue(QueueNames.ANALYTICS) analytics: Queue,
    @InjectQueue(QueueNames.BESTSELLER) bestseller: Queue,
    @InjectQueue(QueueNames.AI) ai: Queue,
    @InjectQueue(QueueNames.TRACKING) tracking: Queue,
  ) {
    this.queues = [
      { name: QueueNames.EMAIL, queue: email },
      { name: QueueNames.EXPORT, queue: exp },
      { name: QueueNames.NOTIFICATION, queue: notification },
      { name: QueueNames.CERTIFICATION, queue: certification },
      { name: QueueNames.SUBSCRIPTION, queue: subscription },
      { name: QueueNames.RFQ, queue: rfq },
      { name: QueueNames.ESCROW, queue: escrow },
      { name: QueueNames.SETTLEMENT, queue: settlement },
      { name: QueueNames.DISPUTE, queue: dispute },
      { name: QueueNames.ANALYTICS, queue: analytics },
      { name: QueueNames.BESTSELLER, queue: bestseller },
      { name: QueueNames.AI, queue: ai },
      { name: QueueNames.TRACKING, queue: tracking },
    ];
  }

  start() {
    if (this.initialized) return;
    this.initialized = true;

    if (!this.registry.isReady) {
      setTimeout(() => this.start(), 3000);
      return;
    }

    const register = this.registry.register;

    const waitingGauge = new Gauge({ name: 'bull_queue_waiting', help: 'Jobs waiting in queue', labelNames: ['queue'], registers: [register] });
    const activeGauge = new Gauge({ name: 'bull_queue_active', help: 'Jobs currently active', labelNames: ['queue'], registers: [register] });
    const delayedGauge = new Gauge({ name: 'bull_queue_delayed', help: 'Delayed jobs', labelNames: ['queue'], registers: [register] });
    const failedGauge = new Gauge({ name: 'bull_queue_failed', help: 'Failed jobs in queue', labelNames: ['queue'], registers: [register] });
    const completedGauge = new Gauge({ name: 'bull_queue_completed', help: 'Completed jobs count', labelNames: ['queue'], registers: [register] });

    const collect = async () => {
      for (const { name, queue } of this.queues) {
        try {
          const counts = await queue.getJobCounts();
          waitingGauge.set({ queue: name }, counts.waiting ?? 0);
          activeGauge.set({ queue: name }, counts.active ?? 0);
          delayedGauge.set({ queue: name }, counts.delayed ?? 0);
          failedGauge.set({ queue: name }, counts.failed ?? 0);
          completedGauge.set({ queue: name }, counts.completed ?? 0);
        } catch (err) {
          this.logger.warn({ err, queue: name }, 'Failed to collect queue metrics');
        }
      }
    };

    collect();
    this.interval = setInterval(collect, 15_000);
    this.logger.log('Queue metrics collection started');
  }

  stop() {
    if (this.interval) clearInterval(this.interval);
  }
}