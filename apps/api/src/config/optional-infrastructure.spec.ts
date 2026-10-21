import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { opensearchConfig, clickhouseConfig, validationSchema } from './app.config';
import { SearchService } from '../modules/search/search.service';
import { ClickhouseService } from '../modules/analytics/clickhouse.service';
import { SearchAnalyticsService } from '../modules/tradfind/services/search-analytics.service';

/**
 * Optional-infrastructure contract.
 *
 * AWS storage, OpenSearch and ClickHouse are optional for the current
 * Hostinger release:
 *  - the application must boot without them,
 *  - no client may be constructed against a fabricated endpoint,
 *  - the affected features must degrade explicitly instead of failing the boot,
 *  - a valid, explicitly supplied endpoint must keep working.
 */

jest.mock('@opensearch-project/opensearch', () => ({
  Client: jest.fn(() => ({})),
}));

jest.mock('@clickhouse/client', () => ({
  createClient: jest.fn(() => ({ insert: jest.fn(), query: jest.fn(), close: jest.fn() })),
}));

const BASE_ENV: Record<string, string> = {
  NODE_ENV: 'production',
  DATABASE_URL: 'postgresql://user@host:5432/db?schema=public',
  REDIS_URL: 'redis://host:6379',
  JWT_SECRET: 'a'.repeat(40),
  JWT_REFRESH_SECRET: 'b'.repeat(40),
};

function validate(env: Record<string, string | undefined>) {
  const merged: Record<string, unknown> = { ...BASE_ENV };
  for (const [k, v] of Object.entries(env)) {
    if (v === undefined) delete merged[k];
    else merged[k] = v;
  }
  return validationSchema.validate(merged, { allowUnknown: true, abortEarly: false });
}

function configService(values: Record<string, unknown>) {
  return {
    get: jest.fn((key: string, defaultValue?: unknown) =>
      key in values ? values[key] : defaultValue,
    ),
  } as unknown as ConfigService;
}

describe('optional infrastructure configuration', () => {
  describe('Joi schema', () => {
    it('accepts an environment with the optional settings absent', () => {
      const { error } = validate({
        AWS_BUCKET: undefined,
        OPENSEARCH_URL: undefined,
        OPENSEARCH_USERNAME: undefined,
        CLICKHOUSE_URL: undefined,
      });
      expect(error).toBeUndefined();
    });

    it('accepts an environment with the optional settings present but empty', () => {
      const { error } = validate({
        AWS_BUCKET: '',
        OPENSEARCH_URL: '',
        OPENSEARCH_USERNAME: '',
        CLICKHOUSE_URL: '',
      });
      expect(error).toBeUndefined();
    });

    it('still rejects a malformed optional URL', () => {
      const { error } = validate({ OPENSEARCH_URL: 'not-a-url' });
      expect(error).toBeDefined();
    });

    it('still requires the database, redis and JWT secrets', () => {
      expect(validate({ DATABASE_URL: undefined }).error).toBeDefined();
      expect(validate({ REDIS_URL: undefined }).error).toBeDefined();
      expect(validate({ JWT_SECRET: undefined }).error).toBeDefined();
      expect(validate({ JWT_SECRET: 'too-short' }).error).toBeDefined();
    });
  });

  describe('config namespaces', () => {
    const saved = { ...process.env };

    afterEach(() => {
      process.env = { ...saved };
    });

    it('resolves an absent OpenSearch endpoint to an empty (disabled) value, not a fake host', () => {
      delete process.env.OPENSEARCH_URL;
      delete process.env.OPENSEARCH_USERNAME;
      const cfg = opensearchConfig() as Record<string, unknown>;
      expect(cfg.url).toBe('');
      expect(cfg.username).toBe('');
    });

    it('resolves an absent ClickHouse endpoint to an empty (disabled) value, not a fake host', () => {
      delete process.env.CLICKHOUSE_URL;
      const cfg = clickhouseConfig() as Record<string, unknown>;
      expect(cfg.url).toBe('');
    });

    it('preserves an explicitly supplied OpenSearch endpoint', () => {
      process.env.OPENSEARCH_URL = 'https://search.internal:9200';
      process.env.OPENSEARCH_USERNAME = 'svc';
      const cfg = opensearchConfig() as Record<string, unknown>;
      expect(cfg.url).toBe('https://search.internal:9200');
      expect(cfg.username).toBe('svc');
    });
  });

  describe('SearchService', () => {
    it('does not create a client and reports the feature as disabled when no endpoint is configured', async () => {
      const { Client } = require('@opensearch-project/opensearch');
      (Client as jest.Mock).mockClear();

      const module: TestingModule = await Test.createTestingModule({
        providers: [
          SearchService,
          { provide: ConfigService, useValue: configService({ 'opensearch.url': '', 'opensearch.username': '' }) },
        ],
      }).compile();
      const service = module.get<SearchService>(SearchService);

      expect(service.isEnabled()).toBe(false);
      expect(Client).not.toHaveBeenCalled();
      expect(await service.ping()).toBe(false);
    });

    it('degrades explicitly instead of throwing when searching without OpenSearch', async () => {
      const module: TestingModule = await Test.createTestingModule({
        providers: [
          SearchService,
          { provide: ConfigService, useValue: configService({ 'opensearch.url': '' }) },
        ],
      }).compile();
      const service = module.get<SearchService>(SearchService);

      const result = await service.search('products', 'steel');
      expect(result.hits).toEqual([]);
      expect(result.total).toBe(0);
      expect(result.degraded).toBe(true);
      expect(result.error).toBe('opensearch_not_configured');
    });

    it('creates the client when a valid endpoint is configured', async () => {
      const { Client } = require('@opensearch-project/opensearch');
      (Client as jest.Mock).mockClear();

      const module: TestingModule = await Test.createTestingModule({
        providers: [
          SearchService,
          {
            provide: ConfigService,
            useValue: configService({
              'opensearch.url': 'https://search.internal:9200',
              'opensearch.username': 'svc',
              'opensearch.password': 'pw',
            }),
          },
        ],
      }).compile();
      const service = module.get<SearchService>(SearchService);

      expect(service.isEnabled()).toBe(true);
      expect(Client).toHaveBeenCalled();
    });
  });

  describe('ClickhouseService', () => {
    it('does not create a client and reports the feature as disabled when no endpoint is configured', async () => {
      const module: TestingModule = await Test.createTestingModule({
        providers: [
          ClickhouseService,
          { provide: ConfigService, useValue: configService({ 'clickhouse.url': '' }) },
        ],
      }).compile();
      const service = module.get<ClickhouseService>(ClickhouseService);

      expect(service.isEnabled()).toBe(false);
      expect(await service.query('SELECT 1')).toEqual([]);
      await expect(service.insert('seller_analytics_events', [{ a: 1 }])).resolves.toBeUndefined();
    });
  });

  describe('SearchAnalyticsService (second, independent ClickHouse client)', () => {
    it('does not create a client and skips analytics when no endpoint is configured', async () => {
      const { createClient } = require('@clickhouse/client');
      (createClient as jest.Mock).mockClear();

      const module: TestingModule = await Test.createTestingModule({
        providers: [
          SearchAnalyticsService,
          { provide: ConfigService, useValue: configService({ 'clickhouse.url': '' }) },
        ],
      }).compile();
      const service = module.get<SearchAnalyticsService>(SearchAnalyticsService);

      expect(service.isEnabled()).toBe(false);
      expect(createClient).not.toHaveBeenCalled();
      expect(await service.getPopularQueries()).toEqual([]);
      expect(await service.getSearchAnalyticsSummary()).toEqual({
        totalSearches: 0,
        uniqueQueries: 0,
        avgResultsPerSearch: 0,
        topQueries: [],
      });
      await expect(
        service.trackSearch({
          query: 'steel',
          entityType: 'PRODUCT',
          resultCount: 0,
          timestamp: new Date(),
        } as any),
      ).resolves.toBeUndefined();
    });
  });
});
