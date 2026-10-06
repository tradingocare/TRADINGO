import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { HealthController } from './health.controller';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../common/services/redis.service';
import { ClickhouseService } from '../modules/analytics/clickhouse.service';
import { StorageService } from '../modules/storage/storage.service';
import { SearchService } from '../modules/search/search.service';
import { ProductionConfigValidator } from '../common/services/production-config-validator.service';

describe('HealthController', () => {
  let controller: HealthController;
  let mockPrisma: any;
  let mockRedis: any;
  let mockClickhouse: any;
  let mockStorage: any;
  let mockSearch: any;

  beforeEach(async () => {
    mockPrisma = { $queryRaw: jest.fn().mockResolvedValue([{ '?column?': 1 }]) };
    mockRedis = { getClient: jest.fn().mockResolvedValue({ ping: jest.fn().mockResolvedValue('PONG') }) };
    mockClickhouse = { ping: jest.fn().mockResolvedValue(true) };
    mockStorage = { check: jest.fn().mockResolvedValue(true) };
    mockSearch = { ping: jest.fn().mockResolvedValue(true) };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [
        { provide: PrismaService, useValue: mockPrisma },
        { provide: RedisService, useValue: mockRedis },
        { provide: ClickhouseService, useValue: mockClickhouse },
        { provide: StorageService, useValue: mockStorage },
        { provide: SearchService, useValue: mockSearch },
        { provide: ConfigService, useValue: { get: jest.fn().mockReturnValue('') } },
        { provide: ProductionConfigValidator, useValue: { validate: jest.fn().mockReturnValue({ paymentMode: 'test', isProduction: false, errors: [], warnings: [], report: {} }) } },
      ],
    }).compile();

    controller = module.get<HealthController>(HealthController);
  });

  describe('check', () => {
    it('should return health check results', async () => {
      const result = await controller.check();
      expect(result.status).toBe('ok');
      expect(result.checks.database.status).toBe('up');
    });
  });

  describe('live', () => {
    it('should return ok with timestamp', () => {
      const result = controller.live();
      expect(result.status).toBe('ok');
      expect(result.timestamp).toBeDefined();
    });
  });

  describe('ready', () => {
    it('should return ok/up object when DB is reachable (Fastify-safe, no Express res)', async () => {
      const result = await controller.ready();
      expect(result).toEqual(expect.objectContaining({ status: 'ok', database: 'up' }));
    });

    it('should return error/unreachable object when DB is unreachable', async () => {
      mockPrisma.$queryRaw.mockRejectedValueOnce(new Error('connection refused'));
      const result = await controller.ready();
      expect(result).toEqual(
        expect.objectContaining({ status: 'error', database: 'unreachable', message: 'connection refused' }),
      );
    });
  });

  describe('diagnostics', () => {
    it('should report all backends up', async () => {
      const result = await controller.diagnostics();
      expect(result.status).toBe('ok');
      expect(result.checks.database.status).toBe('up');
      expect(result.checks.redis.status).toBe('up');
      expect(result.checks.opensearch.status).toBe('up');
      expect(result.checks.clickhouse.status).toBe('up');
      expect(result.checks.storage.status).toBe('up');
    });

    it('should include opensearch check', async () => {
      const result = await controller.diagnostics();
      expect(result.checks.opensearch).toBeDefined();
    });

    it('should return degraded when any dependency is down', async () => {
      mockSearch.ping.mockResolvedValueOnce(false);
      const result = await controller.diagnostics();
      expect(result.status).toBe('degraded');
      expect(result.checks.opensearch.status).toBe('down');
    });

    it('should mark all checks down when all dependencies fail', async () => {
      mockPrisma.$queryRaw.mockRejectedValue(new Error('db fail'));
      mockRedis.getClient.mockRejectedValue(new Error('redis fail'));
      mockSearch.ping.mockResolvedValue(false);
      mockClickhouse.ping.mockResolvedValue(false);
      mockStorage.check.mockResolvedValue(false);
      const result = await controller.diagnostics();
      expect(result.checks.database.status).toBe('down');
      expect(result.checks.redis.status).toBe('down');
      expect(result.checks.opensearch.status).toBe('down');
      expect(result.checks.clickhouse.status).toBe('down');
      expect(result.checks.storage.status).toBe('down');
    });

    it('should return within 3s when checks hang (parallel timeout)', async () => {
      mockPrisma.$queryRaw.mockImplementation(() => new Promise(() => {}));
      mockRedis.getClient.mockImplementation(() => new Promise(() => {}));
      mockSearch.ping.mockImplementation(() => new Promise(() => {}));
      mockClickhouse.ping.mockImplementation(() => new Promise(() => {}));
      mockStorage.check.mockImplementation(() => new Promise(() => {}));
      const t0 = Date.now();
      const result = await controller.diagnostics();
      const elapsed = Date.now() - t0;
      expect(elapsed).toBeLessThan(3000);
      expect(result.status).toBe('degraded');
    });
  });
});
