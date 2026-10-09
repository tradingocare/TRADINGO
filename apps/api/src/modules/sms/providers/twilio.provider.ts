import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Twilio } from 'twilio';
import type { SmsProvider, SmsResult } from '../sms-provider.interface';

@Injectable()
export class TwilioSmsProvider implements SmsProvider {
  private readonly logger = new Logger(TwilioSmsProvider.name);
  private twilioClient: Twilio | null = null;

  constructor(private readonly configService: ConfigService) {
    const accountSid = configService.get<string>('TWILIO_ACCOUNT_SID');
    const authToken = configService.get<string>('TWILIO_AUTH_TOKEN');
    if (accountSid && authToken) {
      try {
        this.twilioClient = new Twilio(accountSid, authToken);
      } catch {
        this.logger.warn('Twilio SDK initialization failed, falling back to noop');
      }
    }
  }

  getName(): string {
    return 'twilio';
  }

  async send(phoneNumber: string, message: string): Promise<SmsResult> {
    if (!this.twilioClient) {
      // Honesty fix (auth-doc final audit): an unconfigured Twilio provider
      // must never claim delivery. Return an explicit failure so callers
      // (SmsService.sendOtp → auth sendOtp/sendLoginOtp/sendResetOtp) surface
      // the honest 503 "Verification service temporarily unavailable" instead
      // of a fabricated "OTP sent". The message body is NOT logged here (the
      // OTP must not leak into noop logs).
      this.logger.warn('[Twilio] Not configured — SMS delivery unavailable (no send attempted)');
      return { success: false, provider: 'twilio', error: 'Twilio SMS provider is not configured' };
    }
    try {
      const from = this.configService.get<string>('TWILIO_PHONE_NUMBER');
      if (!from) throw new Error('TWILIO_PHONE_NUMBER not configured');
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
