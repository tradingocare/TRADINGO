import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { SmsProvider } from './sms-provider.interface';
import { ConsoleSmsProvider } from './providers/console.provider';
import { TwilioSmsProvider } from './providers/twilio.provider';

@Injectable()
export class SmsProviderFactory {
  private readonly logger = new Logger(SmsProviderFactory.name);
  private provider: SmsProvider;

  constructor(
    configService: ConfigService,
    consoleProvider: ConsoleSmsProvider,
    twilioProvider: TwilioSmsProvider,
  ) {
    const providerName = configService.get<string>('SMS_PROVIDER', 'console');
    this.logger.log(`Initializing SMS provider: ${providerName}`);

    const providers: Record<string, SmsProvider> = {
      console: consoleProvider,
      twilio: twilioProvider,
    };

    this.provider = providers[providerName] || consoleProvider;
  }

  getProvider(): SmsProvider {
    return this.provider;
  }
}
