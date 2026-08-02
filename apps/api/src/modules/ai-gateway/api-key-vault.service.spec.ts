import { Test, TestingModule } from '@nestjs/testing';
import { ApiKeyVaultService } from './api-key-vault.service';
import { ConfigService } from '@nestjs/config';

describe('ApiKeyVaultService', () => {
  let service: ApiKeyVaultService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ApiKeyVaultService,
        { provide: ConfigService, useValue: { get: jest.fn().mockReturnValue('test-key') } },
      ],
    }).compile();

    service = module.get<ApiKeyVaultService>(ApiKeyVaultService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getKey', () => {
    it('should return API key for provider', () => {
      const key = service.getKey('openrouter');
      expect(key).toBeDefined();
    });
  });

  describe('rotateKey', () => {
    it('should rotate key without error', async () => {
      await expect(service.rotateKey('openrouter')).resolves.not.toThrow();
    });
  });
});
