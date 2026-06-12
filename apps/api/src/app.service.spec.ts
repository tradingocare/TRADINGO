import { Test, TestingModule } from '@nestjs/testing';
import { AppService } from './app.service';

describe('AppService', () => {
  let service: AppService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AppService],
    }).compile();
    service = module.get<AppService>(AppService);
  });

  it('should return status ok', () => {
    const result = service.getStatus();
    expect(result.status).toBe('ok');
    expect(result.service).toBe('tradingo-api');
    expect(result.version).toBe('1.0.0');
  });
});
