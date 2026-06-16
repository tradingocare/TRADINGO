import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';
import { ChatGateway } from './chat.gateway';
import { ChatFilterService } from './chat-filter.service';
import { ChatPresenceService } from './chat-presence.service';
import { ChatAnalyticsService } from './chat-analytics.service';
import { ChatSearchService } from './chat-search.service';
import { AnalyticsModule } from '../analytics/analytics.module';
import { StorageModule } from '../storage/storage.module';
import { SearchModule } from '../search/search.module';

@Module({
  imports: [
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('jwt.secret'),
        signOptions: { expiresIn: configService.get<string>('jwt.expiresIn', '15m') as any },
      }),
      inject: [ConfigService],
    }),
    StorageModule,
    SearchModule,
    AnalyticsModule,
  ],
  controllers: [ChatController],
  providers: [ChatService, ChatGateway, ChatFilterService, ChatPresenceService, ChatAnalyticsService, ChatSearchService],
  exports: [ChatService, ChatFilterService, ChatPresenceService, ChatAnalyticsService, ChatSearchService],
})
export class ChatModule {}
