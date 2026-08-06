import { Test, TestingModule } from '@nestjs/testing';
import { HealthController } from './health.controller';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../common/services/redis.service';
import { ClickhouseService } from '../modules/analytics/clickhouse.service';
import { StorageService } from '../modules/storage/storage.service';

describe('HealthController', () => {
  let controller: HealthController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [
        { provide: PrismaService, useValue: { $queryRaw: jest.fn().mockResolvedValue([{ '?column?': 1 }]) } },
        { provide: RedisService, useValue: { client: { ping: jest.fn().mockResolvedValue('PONG') } } },
        { provide: ClickhouseService, useValue: { ping: jest.fn().mockResolvedValue(true) } },
        { provide: StorageService, useValue: { check: jest.fn().mockResolvedValue(true) } },
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
    it('should return ok with timestamp', async () => {
      const result = controller.live();
      expect(result.status).toBe('ok');
      expect(result.timestamp).toBeDefined();
    });
  });

  describe('diagnostics', () => {
    it('should report all backends up', async () => {
      global.fetch = jest.fn().mockResolvedValue({ ok: true }) as unknown as typeof fetch;
      const result = await controller.diagnostics();
      expect(result.status).toBe('ok');
      expect(result.checks.database.status).toBe('up');
      expect(result.checks.redis.status).toBe('up');
      expect(result.checks.clickhouse.status).toBe('up');
      expect(result.checks.storage.status).toBe('up');
    });
  });
});