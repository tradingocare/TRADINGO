import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { getQueueToken } from '@nestjs/bullmq';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { RedisService } from '../src/common/services/redis.service';

// Mock BullMQ Worker to prevent Redis connection requirements
jest.mock('bullmq', () => {
  const original = jest.requireActual('bullmq');
  class MockWorker {
    on: jest.Mock;
    constructor() { this.on = jest.fn(); }
    async close() { /* no-op */ }
  }
  return { ...original, Worker: MockWorker };
});

describe('AppController (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(PrismaService)
      .useValue({} as any)
      .overrideProvider(RedisService)
      .useValue({} as any)
      .overrideProvider(getQueueToken('email'))
      .useValue({ add: jest.fn(), opts: { connection: {} } })
      .overrideProvider(getQueueToken('export'))
      .useValue({ add: jest.fn(), opts: { connection: {} } })
      .compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    app.setGlobalPrefix('api/v1');
    await app.init();
  });

  it('/ (GET) returns status', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/');
    console.log('app.e2e status response:', res.status, res.body);
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.service).toBe('tradingo-api');
  });

  afterAll(async () => {
    await app.close();
  });
});
