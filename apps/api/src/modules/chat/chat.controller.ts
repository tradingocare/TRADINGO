import { Controller, Get, Post, Patch, Param, Body, Query, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { ChatService } from './chat.service';
import { ChatAnalyticsService } from './chat-analytics.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CompanyOwnerGuard } from '../../common/guards/company-owner.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { CreateConversationDto, SearchMessagesDto, ReportMessageDto, UploadUrlDto } from './dto/chat.dto';

@ApiTags('TRADCONNECT')
@UseGuards(JwtAuthGuard, CompanyOwnerGuard)
@Controller('companies/:companyId/tradconnect')
export class ChatController {
  constructor(
    private readonly chatService: ChatService,
    private readonly chatAnalytics: ChatAnalyticsService,
  ) {}

  @Get('conversations')
  @ApiOperation({ summary: 'List conversations for the company user' })
  async getConversations(
    @Param('companyId') companyId: string,
    @CurrentUser('sub') userId: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.chatService.getConversations(companyId, userId, page ?? 1, limit ?? 20);
  }

  @Post('conversations')
  @ApiOperation({ summary: 'Create a new conversation (DIRECT, RFQ_NEGOTIATION, or ORDER)' })
  async createConversation(
    @Param('companyId') companyId: string,
    @CurrentUser('sub') userId: string,
    @Body() dto: CreateConversationDto,
  ) {
    return this.chatService.createConversation(companyId, userId, dto);
  }

  @Get('conversations/rfq/:rfqId')
  @ApiOperation({ summary: 'Get or create RFQ negotiation conversation' })
  async getOrCreateRfqConversation(
    @Param('companyId') companyId: string,
    @Param('rfqId') rfqId: string,
    @CurrentUser('sub') userId: string,
  ) {
    const conv = await this.chatService.getOrCreateRfqConversation(companyId, rfqId, userId);
    const isNew = conv.createdAt.getTime() > Date.now() - 1000;
    if (isNew) {
      await this.chatAnalytics.trackEvent('RFQ_NEGOTIATION_STARTED', companyId, userId, {
        rfqId, conversationId: conv.id,
      });
    }
    return conv;
  }

  @Get('conversations/:conversationId')
  @ApiOperation({ summary: 'Get conversation details' })
  async getConversationById(
    @Param('conversationId') conversationId: string,
    @CurrentUser('sub') userId: string,
  ) {
    return this.chatService.getConversationById(conversationId, userId);
  }

  @Get('conversations/:conversationId/messages')
  @ApiOperation({ summary: 'Get paginated messages for a conversation' })
  async getMessages(
    @Param('conversationId') conversationId: string,
    @CurrentUser('sub') userId: string,
    @Query('cursor') cursor?: string,
    @Query('limit') limit?: number,
  ) {
    return this.chatService.getMessages(conversationId, userId, cursor, limit ? +limit : 50);
  }

  @Post('conversations/:conversationId/messages')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Send a message in a conversation' })
  async sendMessage(
    @Param('companyId') companyId: string,
    @Param('conversationId') conversationId: string,
    @CurrentUser('sub') userId: string,
    @Body() dto: any,
  ) {
    return this.chatService.sendMessage(conversationId, companyId, userId, dto);
  }

  @Patch('conversations/:conversationId/archive')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Archive a conversation' })
  async archiveConversation(
    @Param('conversationId') conversationId: string,
    @CurrentUser('sub') userId: string,
  ) {
    return this.chatService.archiveConversation(conversationId, userId);
  }

  @Post('conversations/:conversationId/messages/:messageId/delete')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete own message' })
  async deleteMessage(
    @Param('conversationId') conversationId: string,
    @Param('messageId') messageId: string,
    @CurrentUser('sub') userId: string,
  ) {
    return this.chatService.deleteMessage(conversationId, messageId, userId);
  }

  @Post('conversations/:conversationId/messages/:messageId/seen')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Mark message as seen' })
  async markAsSeen(
    @Param('conversationId') conversationId: string,
    @Param('messageId') messageId: string,
    @CurrentUser('sub') userId: string,
  ) {
    return this.chatService.markAsSeen(conversationId, messageId, userId);
  }

  @Get('search')
  @ApiOperation({ summary: 'Search messages across conversations' })
  async searchMessages(
    @Param('companyId') companyId: string,
    @CurrentUser('sub') userId: string,
    @Query() query: SearchMessagesDto,
  ) {
    return this.chatService.searchMessages(companyId, userId, query);
  }

  @Post('conversations/:conversationId/block/:blockedUserId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Block a user in a conversation' })
  async blockUser(
    @Param('companyId') companyId: string,
    @Param('conversationId') conversationId: string,
    @Param('blockedUserId') blockedUserId: string,
    @CurrentUser('sub') userId: string,
    @Body('reason') reason?: string,
  ) {
    const result = await this.chatService.blockUser(conversationId, blockedUserId, userId, reason);
    await this.chatAnalytics.trackEvent('USER_BLOCKED', companyId, userId, {
      conversationId, blockedUserId, reason,
    });
    return result;
  }

  @Post('conversations/:conversationId/messages/:messageId/report')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Report a message' })
  async reportMessage(
    @Param('companyId') companyId: string,
    @Param('conversationId') conversationId: string,
    @Param('messageId') messageId: string,
    @CurrentUser('sub') userId: string,
    @Body() dto: ReportMessageDto,
  ) {
    const result = await this.chatService.reportMessage(conversationId, messageId, userId, dto);
    await this.chatAnalytics.trackEvent('REPORT_CREATED', companyId, userId, {
      conversationId, messageId, reason: dto.reason,
    });
    return result;
  }

  @Get('unread')
  @ApiOperation({ summary: 'Get total unread count across conversations' })
  async getUnreadCount(@CurrentUser('sub') userId: string) {
    return this.chatService.getUnreadCount(userId);
  }

  @Post('upload-url')
  @ApiOperation({ summary: 'Generate presigned upload URL for file attachment' })
  async generateUploadUrl(
    @Param('companyId') companyId: string,
    @CurrentUser('sub') userId: string,
    @Body() dto: UploadUrlDto,
  ) {
    return this.chatService.generateUploadUrl(companyId, userId, dto.fileName, dto.mimeType, dto.fileSize);
  }
}
