import { Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from 'crypto'
import { ProductionConfigValidator } from '../../common/services/production-config-validator.service'

@Injectable()
export class ApiKeyVaultService {
  private readonly logger = new Logger(ApiKeyVaultService.name)
  private readonly algorithm = 'aes-256-gcm'
  private readonly key: Buffer | null

  constructor(private readonly configService: ConfigService) {
    const secret = configService.get<string>('AI_VAULT_MASTER_KEY', '') ?? '';
    if (
      !secret ||
      ProductionConfigValidator.isPlaceholder(secret) ||
      ProductionConfigValidator.isKnownUnsafeSecret(secret)
    ) {
      // Fail closed on USE, not on construction. The API must still be able to
      // boot so the configuration validator can report the misconfiguration;
      // but no provider credential may be encrypted or decrypted while the key
      // is missing, empty or a publicly known value.
      this.key = null;
      this.logger.warn(
        'AI_VAULT_MASTER_KEY is not set or is a known unsafe value — the provider API key vault is disabled',
      );
      return;
    }
    this.key = scryptSync(secret, 'tradingo-vault-salt', 32);
  }

  /** True when a usable master key is configured. */
  isEnabled(): boolean {
    return this.key !== null;
  }

  encrypt(plaintext: string): string {
    if (!this.key) {
      throw new Error(
        'AI_VAULT_MASTER_KEY is not set or is a known unsafe value — the API key vault is disabled',
      );
    }
    const iv = randomBytes(12);
    const cipher = createCipheriv(this.algorithm, this.key, iv);
    let encrypted = cipher.update(plaintext, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    const authTag = cipher.getAuthTag().toString('hex');
    return `${iv.toString('hex')}:${authTag}:${encrypted}`;
  }

  decrypt(ciphertext: string): string {
    if (!this.key) {
      throw new Error(
        'AI_VAULT_MASTER_KEY is not set or is a known unsafe value — the API key vault is disabled',
      );
    }
    const parts = ciphertext.split(':')
    if (parts.length !== 3) throw new Error('Invalid encrypted key format')
    const [ivHex, authTagHex, encrypted] = parts
    const iv = Buffer.from(ivHex, 'hex')
    const authTag = Buffer.from(authTagHex, 'hex')
    const decipher = createDecipheriv(this.algorithm, this.key, iv)
    decipher.setAuthTag(authTag)
    let decrypted = decipher.update(encrypted, 'hex', 'utf8')
    decrypted += decipher.final('utf8')
    return decrypted
  }
}
