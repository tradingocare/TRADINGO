import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class TurnstileService {
  private readonly logger = new Logger(TurnstileService.name);
  private readonly secretKey: string;
  private readonly verifyUrl = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';

  constructor(private readonly configService: ConfigService) {
    this.secretKey = this.configService.get<string>('TURNSTILE_SECRET_KEY') || '';
  }

  get isConfigured(): boolean {
    return this.secretKey.length > 0;
  }

  async verify(token: string, ip?: string): Promise<{ success: boolean; error?: string }> {
    if (!this.secretKey) {
      this.logger.warn('Turnstile secret key not configured — skipping verification');
      return { success: true };
    }

    try {
      const body = new URLSearchParams({ secret: this.secretKey, response: token });
      if (ip) body.append('remoteip', ip);

      const response = await fetch(this.verifyUrl, {
        method: 'POST',
        body,
        signal: AbortSignal.timeout(5000),
      });
      const data: any = await response.json();
      return { success: data.success, error: data['error-codes']?.[0] };
    } catch (err) {
      this.logger.error(`Turnstile verification failed: ${(err as Error).message}`);
      return { success: false, error: 'Verification service unavailable' };
    }
  }
}
