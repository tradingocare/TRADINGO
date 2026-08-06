import { Test, TestingModule } from '@nestjs/testing';
import { ApiKeyVaultService } from './api-key-vault.service';
import { ConfigService } from '@nestjs/config';

describe('ApiKeyVaultService', () => {
  let service: ApiKeyVaultService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ApiKeyVaultService,
        { provide: ConfigService, useValue: { get: jest.fn().mockReturnValue('vault-test-master-key-0123456789abcdef') } },
      ],
    }).compile();

    service = module.get<ApiKeyVaultService>(ApiKeyVaultService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should throw when master key is missing or placeholder', () => {
    expect(() => {
      new ApiKeyVaultService({ get: jest.fn().mockReturnValue('') } as any);
    }).toThrow();
  });

  describe('encrypt/decrypt', () => {
    it('should round-trip a key', () => {
      const encrypted = service.encrypt('sk-test-12345');
      expect(encrypted).not.toContain('sk-test-12345');
      expect(encrypted.split(':')).toHaveLength(3);
      expect(service.decrypt(encrypted)).toBe('sk-test-12345');
    });

    it('should produce unique ciphertexts per call', () => {
      const a = service.encrypt('secret-value');
      const b = service.encrypt('secret-value');
      expect(a).not.toBe(b);
    });

    it('should throw on invalid format', () => {
      expect(() => service.decrypt('not-a-valid-ciphertext')).toThrow('Invalid encrypted key format');
    });
  });
});
