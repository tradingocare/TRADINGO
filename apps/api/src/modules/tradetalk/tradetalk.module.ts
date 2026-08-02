import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { AiGatewayModule } from '../ai-gateway/ai-gateway.module';
import { TradeTalkService } from './tradetalk.service';
import { TradeTalkController } from './tradetalk.controller';
import { TradeTalkAdminController } from './tradetalk-admin.controller';
import { AiTradeTalkController } from './ai-tradetalk.controller';
import { AiTradeTalkService } from './ai-tradetalk.service';
import { SocialPostService } from './services/social-post.service';
import { SocialFeedService } from './services/social-feed.service';
import { SocialFollowService } from './services/social-follow.service';

@Module({
  imports: [PrismaModule, AiGatewayModule],
  controllers: [TradeTalkController, TradeTalkAdminController, AiTradeTalkController],
  providers: [TradeTalkService, AiTradeTalkService, SocialPostService, SocialFeedService, SocialFollowService],
  exports: [TradeTalkService, AiTradeTalkService, SocialPostService, SocialFeedService, SocialFollowService],
})
export class TradeTalkModule {}
