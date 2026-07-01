import {
  WebSocketGateway, WebSocketServer, SubscribeMessage, OnGatewayConnection, OnGatewayDisconnect,
  ConnectedSocket, MessageBody,
} from '@nestjs/websockets';
import { Injectable, Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../prisma/prisma.service';
import { ChatService } from './chat.service';
import { ChatPresenceService } from './chat-presence.service';
import { ChatAnalyticsService } from './chat-analytics.service';
import { getWsCorsOrigin } from '../../common/utils/ws-cors';
import { SendMessageDto } from './dto/chat.dto';

const RATE_LIMIT_WINDOW = 60_000;
const RATE_LIMIT_MAX = 30;

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

@WebSocketGateway({
  namespace: '/chat',
  cors: { origin: getWsCorsOrigin(), credentials: true },
})
@Injectable()
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(ChatGateway.name);
  private readonly userSockets = new Map<string, Set<string>>();
  private readonly rateLimits = new Map<string, RateLimitEntry>();
  private readonly onlineUsers = new Set<string>();

  constructor(
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,
    private readonly chatService: ChatService,
    private readonly chatPresence: ChatPresenceService,
    private readonly chatAnalytics: ChatAnalyticsService,
  ) {}

  async handleConnection(socket: Socket) {
    try {
      const token = socket.handshake.auth?.token || socket.handshake.query?.token;
      if (!token) {
        socket.emit('error', { message: 'Authentication required' });
        socket.disconnect();
        return;
      }

      const payload = this.jwtService.verify(token as string);
      const userId = payload.sub;

      (socket as any).user = payload;
      socket.data.userId = userId;

      if (!this.userSockets.has(userId)) {
        this.userSockets.set(userId, new Set());
      }
      this.userSockets.get(userId)!.add(socket.id);

      await this.chatPresence.setOnline(userId);

      if (!this.onlineUsers.has(userId)) {
        this.onlineUsers.add(userId);
        await this.prisma.conversationParticipant.updateMany({
          where: { userId },
          data: { isOnline: true, lastSeenAt: new Date() },
        });
        this.server.emit('presence:online', { userId });
      }

      socket.join(`user:${userId}`);

      const conversations = await this.prisma.conversationParticipant.findMany({
        where: { userId, leftAt: null },
        select: { conversationId: true },
      });
      for (const conv of conversations) {
        socket.join(`conversation:${conv.conversationId}`);
      }

      this.logger.log(`Client connected: ${userId} (${socket.id})`);
    } catch (err) {
      this.logger.warn(`Connection rejected: ${(err as Error).message}`);
      socket.emit('error', { message: 'Invalid token' });
      socket.disconnect();
    }
  }

  async handleDisconnect(socket: Socket) {
    const userId = socket.data?.userId;
    if (!userId) return;

    const sockets = this.userSockets.get(userId);
    if (sockets) {
      sockets.delete(socket.id);
      if (sockets.size === 0) {
        this.userSockets.delete(userId);
        this.onlineUsers.delete(userId);
        await this.chatPresence.setOffline(userId);
        await this.prisma.conversationParticipant.updateMany({
          where: { userId },
          data: { isOnline: false, lastSeenAt: new Date() },
        });
        this.server.emit('presence:offline', { userId });
      }
    }

    this.logger.log(`Client disconnected: ${userId} (${socket.id})`);
  }

  @SubscribeMessage('join:conversation')
  async handleJoinConversation(@ConnectedSocket() socket: Socket, @MessageBody() data: { conversationId: string }) {
    const userId = socket.data.userId;
    const participant = await this.prisma.conversationParticipant.findUnique({
      where: { conversationId_userId: { conversationId: data.conversationId, userId } },
    });
    if (!participant || participant.leftAt) {
      socket.emit('error', { message: 'Access denied to conversation' });
      return;
    }
    socket.join(`conversation:${data.conversationId}`);
  }

  @SubscribeMessage('leave:conversation')
  async handleLeaveConversation(@ConnectedSocket() socket: Socket, @MessageBody() data: { conversationId: string }) {
    socket.leave(`conversation:${data.conversationId}`);
  }

  @SubscribeMessage('message:send')
  async handleSendMessage(@ConnectedSocket() socket: Socket, @MessageBody() data: { conversationId: string } & SendMessageDto) {
    const userId = socket.data.userId;

    if (!this.checkRateLimit(userId)) {
      socket.emit('error', { message: 'Rate limit exceeded. Max 30 messages per minute.' });
      return;
    }

    try {
      const companyId = await this.resolveUserCompany(userId);
      const result = await this.chatService.sendMessage(data.conversationId, companyId, userId, {
        content: data.content,
        replyToId: data.replyToId,
        attachments: data.attachments,
      });

      this.server.to(`conversation:${data.conversationId}`).emit('message:new', result.message);

      for (const recipientId of result.recipientUserIds) {
        this.server.to(`user:${recipientId}`).emit('notification:new', {
          type: 'message',
          conversationId: data.conversationId,
          message: result.message,
        });
      }

      const hasFile = (data.attachments?.length ?? 0) > 0;
      await this.chatAnalytics.trackEvent(
        hasFile ? 'FILE_SHARED' : 'MESSAGE_SENT',
        companyId,
        userId,
        { conversationId: data.conversationId, messageId: result.message.id },
      );
    } catch (err) {
      socket.emit('error', { message: (err as Error).message });
    }
  }

  @SubscribeMessage('message:delete')
  async handleDeleteMessage(@ConnectedSocket() socket: Socket, @MessageBody() data: { conversationId: string; messageId: string }) {
    const userId = socket.data.userId;
    try {
      await this.chatService.deleteMessage(data.conversationId, data.messageId, userId);
      this.server.to(`conversation:${data.conversationId}`).emit('message:deleted', {
        conversationId: data.conversationId,
        messageId: data.messageId,
      });
    } catch (err) {
      socket.emit('error', { message: (err as Error).message });
    }
  }

  @SubscribeMessage('message:seen')
  async handleMarkSeen(@ConnectedSocket() socket: Socket, @MessageBody() data: { conversationId: string; messageId: string }) {
    const userId = socket.data.userId;
    try {
      await this.chatService.markAsSeen(data.conversationId, data.messageId, userId);
      this.server.to(`conversation:${data.conversationId}`).emit('message:seen', {
        conversationId: data.conversationId,
        messageId: data.messageId,
        userId,
        seenAt: new Date(),
      });

      const companyId = await this.resolveUserCompany(userId);
      await this.chatAnalytics.trackEvent('MESSAGE_READ', companyId, userId, {
        conversationId: data.conversationId,
        messageId: data.messageId,
      });
    } catch (err) {
      socket.emit('error', { message: (err as Error).message });
    }
  }

  @SubscribeMessage('typing:start')
  async handleTypingStart(@ConnectedSocket() socket: Socket, @MessageBody() data: { conversationId: string }) {
    const userId = socket.data.userId;
    socket.to(`conversation:${data.conversationId}`).emit('typing:update', {
      conversationId: data.conversationId,
      userId,
      isTyping: true,
    });
  }

  @SubscribeMessage('typing:stop')
  async handleTypingStop(@ConnectedSocket() socket: Socket, @MessageBody() data: { conversationId: string }) {
    const userId = socket.data.userId;
    socket.to(`conversation:${data.conversationId}`).emit('typing:update', {
      conversationId: data.conversationId,
      userId,
      isTyping: false,
    });
  }

  private checkRateLimit(userId: string): boolean {
    const now = Date.now();
    const entry = this.rateLimits.get(userId);

    if (!entry || now > entry.resetAt) {
      this.rateLimits.set(userId, { count: 1, resetAt: now + RATE_LIMIT_WINDOW });
      return true;
    }

    if (entry.count >= RATE_LIMIT_MAX) return false;

    entry.count++;
    return true;
  }

  private async resolveUserCompany(userId: string): Promise<string> {
    const owner = await this.prisma.companyOwner.findFirst({
      where: { userId, isPrimary: true },
    });
    return owner?.companyId ?? 'unknown';
  }
}
