import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { AnalyticsService } from './analytics.service';

const mockClient = {
  insert: jest.fn(),
  query: jest.fn(),
  close: jest.fn(),
};

jest.mock('@clickhouse/client', () => ({
  createClient: jest.fn(() => mockClient),
}));

describe('AnalyticsService', () => {
  let service: AnalyticsService;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AnalyticsService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              const config: Record<string, string> = {
                'clickhouse.url': 'http://localhost:8123',
                'clickhouse.username': 'default',
                'clickhouse.password': '',
              };
              return config[key];
            }),
          },
        },
      ],
    }).compile();
    service = module.get<AnalyticsService>(AnalyticsService);
  });

  describe('trackEvent', () => {
    it('should insert event into clickhouse', async () => {
      await service.trackEvent({
        userId: 'user-1',
        event: 'page_view',
        properties: { page: '/home' },
        timestamp: new Date('2024-01-01T00:00:00Z'),
      });

      expect(mockClient.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          table: 'analytics_events',
          format: 'JSONEachRow',
          values: expect.arrayContaining([
            expect.objectContaining({
              user_id: 'user-1',
              event: 'page_view',
            }),
          ]),
        }),
      );
    });
  });

  describe('query', () => {
    it('should execute raw SQL and return results', async () => {
      const mockJson = jest.fn().mockResolvedValue([{ count: 42 }]);
      mockClient.query.mockResolvedValue({ json: mockJson });

      const result = await service.query('SELECT count(*) as count FROM analytics_events');

      expect(mockClient.query).toHaveBeenCalledWith(
        expect.objectContaining({
          query: 'SELECT count(*) as count FROM analytics_events',
          format: 'JSONEachRow',
        }),
      );
      expect(result).toEqual([{ count: 42 }]);
    });
  });
});
