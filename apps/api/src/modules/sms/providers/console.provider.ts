import { Injectable, Logger } from '@nestjs/common';
import type { SmsProvider, SmsResult } from '../sms-provider.interface';

@Injectable()
export class ConsoleSmsProvider implements SmsProvider {
  private readonly logger = new Logger(ConsoleSmsProvider.name);

  getName(): string {
    return 'console';
  }

  async send(phoneNumber: string, message: string): Promise<SmsResult> {
    this.logger.log(`[SMS] To: ${phoneNumber} | Body: ${message}`);
    return { success: true, messageId: `console-${Date.now()}`, provider: 'console' };
  }

  async sendOtp(phoneNumber: string, otp: string): Promise<SmsResult> {
    const message = `Your TRADINGO verification code is: ${otp}. Valid for 5 minutes.`;
    return this.send(phoneNumber, message);
  }
}
