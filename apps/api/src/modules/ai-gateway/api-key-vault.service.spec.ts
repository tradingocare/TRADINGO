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

  describe('when the master key is missing, empty or a known unsafe value', () => {
    const unsafe = [
      '',
      'change-me-to-a-random-64-char-string',
      'local-development-ai-vault-master-key-32chars-minimum',
      'tradingo-ai-vault-default-key-change-in-production!',
    ];

    it.each(unsafe)('constructs without throwing but disables the vault (%p)', (value) => {
      const disabled = new ApiKeyVaultService({ get: jest.fn().mockReturnValue(value) } as any);
      expect(disabled.isEnabled()).toBe(false);
    });

    it('fails closed on encrypt', () => {
      const disabled = new ApiKeyVaultService({ get: jest.fn().mockReturnValue('') } as any);
      expect(() => disabled.encrypt('sk-test-12345')).toThrow(/AI_VAULT_MASTER_KEY/);
    });

    it('fails closed on decrypt', () => {
      const disabled = new ApiKeyVaultService({ get: jest.fn().mockReturnValue('') } as any);
      expect(() => disabled.decrypt('aa:bb:cc')).toThrow(/AI_VAULT_MASTER_KEY/);
    });
  });

  it('is enabled with a strong configured key', () => {
    expect(service.isEnabled()).toBe(true);
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
