import { Test, TestingModule } from '@nestjs/testing';
import { AnalyticsController } from './analytics.controller';
import { AnalyticsService } from './analytics.service';
import { EventIngestionService } from './event-ingestion.service';

describe('AnalyticsController', () => {
  let controller: AnalyticsController;
  let analyticsService: any;
  let eventIngestionService: any;

  beforeEach(async () => {
    analyticsService = {
      getSellerDashboard: jest.fn(),
      getSellerDailyMetrics: jest.fn(),
      getCharts: jest.fn(),
      getSellerLeaderboardPosition: jest.fn(),
      getAdminDashboard: jest.fn(),
      getSellerLeaderboard: jest.fn(),
      queryRaw: jest.fn(),
    };

    eventIngestionService = {
      track: jest.fn(),
      trackBatch: jest.fn(),
      flush: jest.fn(),
      getBatchSize: jest.fn(),
      getDeadLetterCount: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AnalyticsController],
      providers: [
        { provide: AnalyticsService, useValue: analyticsService },
        { provide: EventIngestionService, useValue: eventIngestionService },
      ],
    }).compile();

    controller = module.get<AnalyticsController>(AnalyticsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should return seller dashboard', async () => {
    await controller.getSellerDashboard('c1', { range: '30d' });
    expect(analyticsService.getSellerDashboard).toHaveBeenCalledWith('c1', { range: '30d' });
  });

  it('should return admin dashboard', async () => {
    await controller.getAdminDashboard({ range: '30d' });
    expect(analyticsService.getAdminDashboard).toHaveBeenCalledWith({ range: '30d' });
  });

  it('should track event', async () => {
    const event = { companyId: 'c1', eventType: 'TEST' };
    await controller.trackEvent('seller_analytics_events', event);
    expect(eventIngestionService.track).toHaveBeenCalledWith('seller_analytics_events', event);
  });

  it('should track batch events', async () => {
    const body = { events: [{ companyId: 'c1', eventType: 'TEST' }] };
    const result = await controller.trackBatch('seller_analytics_events', body);
    expect(result.count).toBe(1);
  });

  it('should return queue depth', async () => {
    eventIngestionService.getBatchSize.mockReturnValue(10);
    eventIngestionService.getDeadLetterCount.mockReturnValue(2);

    const result = await controller.getQueueDepth();
    expect(result.sellerEvents).toBe(10);
    expect(result.deadLetter).toBe(2);
  });

  it('should flush pending events', async () => {
    await controller.flush();
    expect(eventIngestionService.flush).toHaveBeenCalled();
  });
});
