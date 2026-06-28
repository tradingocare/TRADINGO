import { Controller, Get, Post, Patch, Delete, Param, Body, Query, HttpCode, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { MessageService } from './message.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Communication Hub — Messages')
@UseGuards(JwtAuthGuard)
@Controller('communication/conversations/:conversationId/messages')
export class MessageController {
  constructor(private readonly service: MessageService) {}

  @Get()
  @ApiOperation({ summary: 'Get messages in conversation' })
  getMessages(
    @CurrentUser('sub') userId: string,
    @Param('conversationId') conversationId: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    return this.service.getMessages(conversationId, userId, limit ? parseInt(limit) : 50, offset ? parseInt(offset) : 0);
  }

  @Post()
  @ApiOperation({ summary: 'Send a message' })
  send(
    @CurrentUser('sub') userId: string,
    @CurrentUser('companyId') companyId: string,
    @Param('conversationId') conversationId: string,
    @Body() body: any,
  ) {
    return this.service.send(conversationId, userId, companyId, body);
  }

  @Post('read')
  @HttpCode(204)
  @ApiOperation({ summary: 'Mark all messages as read' })
  markRead(@CurrentUser('sub') userId: string, @Param('conversationId') conversationId: string) {
    return this.service.markRead(conversationId, userId);
  }

  @Delete(':messageId')
  @HttpCode(204)
  @ApiOperation({ summary: 'Delete own message' })
  deleteMessage(@CurrentUser('sub') userId: string, @Param('conversationId') conversationId: string, @Param('messageId') messageId: string) {
    return this.service.deleteMessage(conversationId, messageId, userId);
  }

  @Post(':messageId/report')
  @ApiOperation({ summary: 'Report a message' })
  reportMessage(
    @CurrentUser('sub') userId: string,
    @Param('conversationId') conversationId: string,
    @Param('messageId') messageId: string,
    @Body() body: { reason: string; description?: string },
  ) {
    return this.service.reportMessage(conversationId, messageId, userId, body.reason, body.description);
  }
}

@ApiTags('Communication Hub — Messages')
@UseGuards(JwtAuthGuard)
@Controller('communication')
export class MessageStatsController {
  constructor(private readonly service: MessageService) {}

  @Get('unread-count')
  @ApiOperation({ summary: 'Get total unread message count' })
  getUnreadCount(@CurrentUser('sub') userId: string) {
    return this.service.getUnreadCount(userId);
  }
}
