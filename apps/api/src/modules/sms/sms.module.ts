import { Module, Global } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { SmsProviderFactory } from './sms-provider.factory';
import { ConsoleSmsProvider } from './providers/console.provider';
import { TwilioSmsProvider } from './providers/twilio.provider';
import { SmsService } from './sms.service';
import { SmsController } from './sms.controller';

@Global()
@Module({
  imports: [PrismaModule],
  controllers: [SmsController],
  providers: [SmsProviderFactory, ConsoleSmsProvider, TwilioSmsProvider, SmsService],
  exports: [SmsProviderFactory, SmsService],
})
export class SmsModule {}
