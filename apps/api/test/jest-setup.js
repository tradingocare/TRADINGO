process.env.DATABASE_URL = 'postgresql://localhost:5432/tradingo_test';
process.env.REDIS_URL = 'redis://localhost:6379';
process.env.JWT_SECRET = 'e2e-test-jwt-secret-that-is-at-least-32-chars!!';
process.env.JWT_REFRESH_SECRET = 'e2e-test-refresh-secret-that-is-at-least-32-chars!';
process.env.OPENSEARCH_URL = 'http://localhost:9200';
process.env.CLICKHOUSE_URL = 'http://localhost:8123';
process.env.NODE_ENV = 'test';
