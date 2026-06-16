process.env.DATABASE_URL = 'postgresql://localhost:5432/tradingo_test';
process.env.REDIS_URL = 'redis://localhost:6379';
process.env.JWT_SECRET = 'e2e-test-jwt-secret-that-is-at-least-32-chars!!';
process.env.JWT_REFRESH_SECRET = 'e2e-test-refresh-secret-that-is-at-least-32-chars!';
process.env.OPENSEARCH_URL = 'http://localhost:9200';
process.env.CLICKHOUSE_URL = 'http://localhost:8123';
process.env.RAZORPAY_KEY_ID = 'rzp_test_e2e';
process.env.RAZORPAY_KEY_SECRET = 'e2e-secret';
process.env.NODE_ENV = 'test';

// Mock ioredis to prevent BullMQ from trying to connect to Redis
jest.mock('ioredis', () => {
  const MockRedis = jest.fn().mockImplementation(() => ({
    on: jest.fn(),
    once: jest.fn(),
    connect: jest.fn(),
    disconnect: jest.fn(),
    quit: jest.fn(),
    status: 'ready',
  }));
  MockRedis.prototype.on = jest.fn();
  MockRedis.prototype.once = jest.fn();
  MockRedis.prototype.connect = jest.fn();
  MockRedis.prototype.disconnect = jest.fn();
  return MockRedis;
});
