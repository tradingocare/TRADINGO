import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { ClickhouseService } from './clickhouse.service';

describe('ClickhouseService', () => {
  let service: ClickhouseService;
  let configService: any;

  beforeEach(async () => {
    configService = {
      get: jest.fn((key: string) => {
        if (key === 'clickhouse.url') return 'http://localhost:8123';
        if (key === 'clickhouse.username') return 'default';
        if (key === 'clickhouse.password') return '';
        return null;
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ClickhouseService,
        { provide: ConfigService, useValue: configService },
      ],
    }).compile();

    service = module.get<ClickhouseService>(ClickhouseService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should create client with correct config', () => {
    expect(configService.get).toHaveBeenCalledWith('clickhouse.url');
    expect(configService.get).toHaveBeenCalledWith('clickhouse.username');
    expect(configService.get).toHaveBeenCalledWith('clickhouse.password');
  });
});
