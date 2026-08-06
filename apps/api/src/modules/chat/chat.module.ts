import { Module } from '@nestjs/common';
import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';
import { ChatGateway } from './chat.gateway';
import { ChatFilterService } from './chat-filter.service';
import { ChatPresenceService } from './chat-presence.service';
import { ChatAnalyticsService } from './chat-analytics.service';
import { ChatSearchService } from './chat-search.service';
import { AnalyticsModule } from '../analytics/analytics.module';
import { AuthModule } from '../auth/auth.module';
import { StorageModule } from '../storage/storage.module';
import { SearchModule } from '../search/search.module';

@Module({
  imports: [
    StorageModule,
    SearchModule,
    AnalyticsModule,
    AuthModule,
  ],
  controllers: [ChatController],
  providers: [ChatService, ChatGateway, ChatFilterService, ChatPresenceService, ChatAnalyticsService, ChatSearchService],
  exports: [ChatService, ChatFilterService, ChatPresenceService, ChatAnalyticsService, ChatSearchService],
})
export class ChatModule {}
