import { Test, TestingModule } from '@nestjs/testing';
import { PaymentAnalyticsService } from './payment-analytics.service';
import { EventIngestionService } from '../analytics/event-ingestion.service';

describe('PaymentAnalyticsService', () => {
  let service: PaymentAnalyticsService;
  let eventIngestion: Record<string, jest.Mock>;

  beforeEach(async () => {
    eventIngestion = { track: jest.fn(), trackBatch: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PaymentAnalyticsService,
        { provide: EventIngestionService, useValue: eventIngestion },
      ],
    }).compile();

    service = module.get<PaymentAnalyticsService>(PaymentAnalyticsService);
  });

  describe('trackEvent', () => {
    it('should track payment analytics event', async () => {
      await service.trackEvent('c1', 'pay-1', 'PAYMENT_CAPTURED', 1000, 'INR', 'razorpay', { orderId: 'ord-1' });
      expect(eventIngestion.track).toHaveBeenCalledWith('payment_analytics_events', {
        companyId: 'c1',
        paymentId: 'pay-1',
        eventType: 'PAYMENT_CAPTURED',
        amount: 1000,
        currency: 'INR',
        gateway: 'razorpay',
        metadata: { orderId: 'ord-1' },
      });
    });

    it('should handle minimal event data', async () => {
      await service.trackEvent('c1', 'pay-2', 'PAYMENT_REFUNDED');
      expect(eventIngestion.track).toHaveBeenCalledWith('payment_analytics_events', {
        companyId: 'c1',
        paymentId: 'pay-2',
        eventType: 'PAYMENT_REFUNDED',
        amount: undefined,
        currency: undefined,
        gateway: undefined,
        metadata: undefined,
      });
    });
  });
});
