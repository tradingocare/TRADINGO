import { Module, Global } from '@nestjs/common';
import { SmsProviderFactory } from './sms-provider.factory';
import { ConsoleSmsProvider } from './providers/console.provider';
import { TwilioSmsProvider } from './providers/twilio.provider';

@Global()
@Module({
  providers: [SmsProviderFactory, ConsoleSmsProvider, TwilioSmsProvider],
  exports: [SmsProviderFactory],
})
export class SmsModule {}
