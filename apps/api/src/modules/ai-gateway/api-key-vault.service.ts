import { Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from 'crypto'

@Injectable()
export class ApiKeyVaultService {
  private readonly logger = new Logger(ApiKeyVaultService.name)
  private readonly algorithm = 'aes-256-gcm'
  private readonly key: Buffer

  constructor(private readonly configService: ConfigService) {
    const secret = configService.get('AI_VAULT_MASTER_KEY') || 'tradingo-ai-vault-default-key-change-in-production!'
    this.key = scryptSync(secret, 'tradingo-vault-salt', 32)
  }

  encrypt(plaintext: string): string {
    const iv = randomBytes(12)
    const cipher = createCipheriv(this.algorithm, this.key, iv)
    let encrypted = cipher.update(plaintext, 'utf8', 'hex')
    encrypted += cipher.final('hex')
    const authTag = cipher.getAuthTag().toString('hex')
    return `${iv.toString('hex')}:${authTag}:${encrypted}`
  }

  decrypt(ciphertext: string): string {
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
