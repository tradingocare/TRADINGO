import { Injectable, Logger } from '@nestjs/common';
import { Gauge } from 'prom-client';
import { PrismaService } from '../../prisma/prisma.service';
import { MetricsRegistryService } from './metrics-registry.service';

@Injectable()
export class BusinessMetricsService {
  private readonly logger = new Logger(BusinessMetricsService.name);
  private interval: ReturnType<typeof setInterval> | null = null;
  private initialized = false;

  constructor(
    private readonly prisma: PrismaService,
    private readonly registry: MetricsRegistryService,
  ) {}

  start() {
    if (this.initialized) return;
    this.initialized = true;

    if (!this.registry.isReady) {
      this.logger.warn('Metrics registry not ready — will retry in 3s');
      setTimeout(() => this.start(), 3000);
      return;
    }

    const register = this.registry.register;

    const revenueGauge = new Gauge({ name: 'business_revenue_total', help: 'Total captured revenue (paise)', registers: [register] });
    const ordersGauge = new Gauge({ name: 'business_orders_total', help: 'Total orders placed', registers: [register] });
    const usersGauge = new Gauge({ name: 'business_users_total', help: 'Total registered users', registers: [register] });
    const companiesGauge = new Gauge({ name: 'business_companies_total', help: 'Total companies', registers: [register] });
    const rfqGauge = new Gauge({ name: 'business_rfqs_total', help: 'Total RFQs created', registers: [register] });
    const activeSellersGauge = new Gauge({ name: 'business_sellers_active', help: 'Active sellers', registers: [register] });
    const activeBuyersGauge = new Gauge({ name: 'business_buyers_active', help: 'Active buyers', registers: [register] });
    const disputesOpenGauge = new Gauge({ name: 'business_disputes_open', help: 'Open disputes', registers: [register] });
    const verificationsPendingGauge = new Gauge({ name: 'business_verifications_pending', help: 'Pending verifications', registers: [register] });
    const gmvGauge = new Gauge({ name: 'business_gmv_total', help: 'Total GMV (paise)', registers: [register] });
    const quoteGauge = new Gauge({ name: 'business_quotes_total', help: 'Total quotes', registers: [register] });
    const bookingGauge = new Gauge({ name: 'business_tradeserv_bookings', help: 'Total TradeServ bookings', registers: [register] });

    const collect = async () => {
      try {
        const [revenue, orders, users, companies, rfqs, activeSellers, activeBuyers, openDisputes, pendingVerifications, quotes, bookings] =
          await Promise.allSettled([
            this.prisma.payment.aggregate({ where: { status: 'CAPTURED' }, _sum: { amount: true } }),
            this.prisma.order.count(),
            this.prisma.user.count(),
            this.prisma.company.count(),
            this.prisma.rfq.count(),
            this.prisma.company.count({ where: { status: 'ACTIVE' }, take: 10000 }),
            this.prisma.user.count({ where: { isActive: true } }),
            this.prisma.dispute.count({ where: { status: { not: 'RESOLVED' } } }),
            this.prisma.companyVerification.count({ where: { status: 'PENDING' } }),
            this.prisma.quote.count(),
            this.prisma.booking.count(),
          ]);

        if (revenue.status === 'fulfilled') revenueGauge.set(revenue.value._sum?.amount ?? 0);
        if (orders.status === 'fulfilled') ordersGauge.set(orders.value);
        if (users.status === 'fulfilled') usersGauge.set(users.value);
        if (companies.status === 'fulfilled') companiesGauge.set(companies.value);
        if (rfqs.status === 'fulfilled') rfqGauge.set(rfqs.value);
        if (activeSellers.status === 'fulfilled') activeSellersGauge.set(activeSellers.value);
        if (activeBuyers.status === 'fulfilled') activeBuyersGauge.set(activeBuyers.value);
        if (openDisputes.status === 'fulfilled') disputesOpenGauge.set(openDisputes.value);
        if (pendingVerifications.status === 'fulfilled') verificationsPendingGauge.set(pendingVerifications.value);
        if (quotes.status === 'fulfilled') quoteGauge.set(quotes.value);
        if (bookings.status === 'fulfilled') bookingGauge.set(bookings.value);

        const gmvResult = await this.prisma.orderItem.aggregate({
          where: { order: { status: 'DELIVERED' } },
          _sum: { totalPrice: true },
        });
        const gmv = Number(gmvResult._sum.totalPrice ?? 0);
        gmvGauge.set(gmv);
      } catch (err) {
        this.logger.warn({ err }, 'Business metrics collection failed');
      }
    };

    collect();
    this.interval = setInterval(collect, 60_000);
    this.logger.log('Business metrics collection started');
  }

  stop() {
    if (this.interval) clearInterval(this.interval);
  }
}