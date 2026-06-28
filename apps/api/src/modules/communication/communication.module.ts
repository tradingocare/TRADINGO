import { Module } from '@nestjs/common';
import { ConversationController } from './conversation.controller';
import { ConversationService } from './conversation.service';
import { MessageController } from './message.controller';
import { MessageService } from './message.service';
import { LabelController } from './label.controller';
import { LabelService } from './label.service';
import { TemplateController } from './template.controller';
import { TemplateService } from './template.service';
import { ModerationController } from './moderation.controller';
import { ModerationService } from './moderation.service';

@Module({
  controllers: [
    ConversationController,
    MessageController,
    LabelController,
    TemplateController,
    ModerationController,
  ],
  providers: [
    ConversationService,
    MessageService,
    LabelService,
    TemplateService,
    ModerationService,
  ],
  exports: [ConversationService, MessageService],
})
export class CommunicationModule {}
