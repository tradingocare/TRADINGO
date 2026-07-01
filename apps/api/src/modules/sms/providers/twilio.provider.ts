import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { SmsProvider, SmsResult } from '../sms-provider.interface';

@Injectable()
export class TwilioSmsProvider implements SmsProvider {
  private readonly logger = new Logger(TwilioSmsProvider.name);
  private twilioClient: any;

  constructor(private readonly configService: ConfigService) {
    const accountSid = configService.get<string>('TWILIO_ACCOUNT_SID');
    const authToken = configService.get<string>('TWILIO_AUTH_TOKEN');
    if (accountSid && authToken) {
      try {
        this.twilioClient = require('twilio')(accountSid, authToken);
      } catch {
        this.logger.warn('Twilio SDK not available, falling back to noop');
      }
    }
  }

  getName(): string {
    return 'twilio';
  }

  async send(phoneNumber: string, message: string): Promise<SmsResult> {
    if (!this.twilioClient) {
      this.logger.warn(`[Twilio] Not configured — would send to ${phoneNumber}: ${message}`);
      return { success: true, messageId: `twilio-noop-${Date.now()}`, provider: 'twilio' };
    }
    try {
      const from = this.configService.get<string>('TWILIO_PHONE_NUMBER');
      const result = await this.twilioClient.messages.create({ from, to: phoneNumber, body: message });
      this.logger.log(`[Twilio] Sent to ${phoneNumber}, SID: ${result.sid}`);
      return { success: true, messageId: result.sid, provider: 'twilio' };
    } catch (err) {
      this.logger.error(`[Twilio] Failed to send to ${phoneNumber}: ${(err as Error).message}`);
      return { success: false, provider: 'twilio', error: (err as Error).message };
    }
  }

  async sendOtp(phoneNumber: string, otp: string): Promise<SmsResult> {
    const message = `Your TRADINGO verification code is: ${otp}. Valid for 5 minutes.`;
    return this.send(phoneNumber, message);
  }
}
