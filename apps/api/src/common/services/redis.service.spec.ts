import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { RedisService } from './redis.service';

const mockRedis = {
  get: jest.fn(),
  set: jest.fn(),
  del: jest.fn(),
  incr: jest.fn(),
  expire: jest.fn(),
  exists: jest.fn(),
  ttl: jest.fn(),
  on: jest.fn(),
  disconnect: jest.fn(),
};

jest.mock('ioredis', () => ({
  Redis: jest.fn(() => mockRedis),
}));

describe('RedisService', () => {
  let service: RedisService;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RedisService,
        { provide: ConfigService, useValue: { get: jest.fn(() => 'redis://localhost:6379') } },
      ],
    }).compile();
    service = module.get<RedisService>(RedisService);
  });

  describe('get', () => {
    it('should return value for existing key', async () => {
      mockRedis.get.mockResolvedValue('value1');
      const result = await service.get('key1');
      expect(result).toBe('value1');
    });

    it('should return null for missing key', async () => {
      mockRedis.get.mockResolvedValue(null);
      const result = await service.get('missing');
      expect(result).toBeNull();
    });
  });

  describe('set', () => {
    it('should set without TTL', async () => {
      await service.set('key', 'value');
      expect(mockRedis.set).toHaveBeenCalledWith('key', 'value');
    });

    it('should set with TTL', async () => {
      await service.set('key', 'value', 60);
      expect(mockRedis.set).toHaveBeenCalledWith('key', 'value', 'EX', 60);
    });
  });

  describe('del', () => {
    it('should delete key', async () => {
      await service.del('key');
      expect(mockRedis.del).toHaveBeenCalledWith('key');
    });
  });

  describe('incr', () => {
    it('should increment and return the new value', async () => {
      mockRedis.incr.mockResolvedValue(5);
      const result = await service.incr('counter');
      expect(result).toBe(5);
    });
  });

  describe('expire', () => {
    it('should set expiry on key', async () => {
      await service.expire('key', 30);
      expect(mockRedis.expire).toHaveBeenCalledWith('key', 30);
    });
  });

  describe('exists', () => {
    it('should return true when key exists', async () => {
      mockRedis.exists.mockResolvedValue(1);
      const result = await service.exists('key');
      expect(result).toBe(true);
    });

    it('should return false when key does not exist', async () => {
      mockRedis.exists.mockResolvedValue(0);
      const result = await service.exists('missing');
      expect(result).toBe(false);
    });
  });

  describe('ttl', () => {
    it('should return TTL', async () => {
      mockRedis.ttl.mockResolvedValue(42);
      const result = await service.ttl('key');
      expect(result).toBe(42);
    });
  });

  describe('onModuleDestroy', () => {
    it('should disconnect the Redis client', () => {
      service.onModuleDestroy();
      expect(mockRedis.disconnect).toHaveBeenCalled();
    });
  });
});
