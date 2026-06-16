import { Test, TestingModule } from '@nestjs/testing';
import { ChatGateway } from './chat.gateway';
import { ChatService } from './chat.service';
import { ChatPresenceService } from './chat-presence.service';
import { ChatAnalyticsService } from './chat-analytics.service';
import { PrismaService } from '../../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';

class MockSocket {
  id = 'socket-1';
  data: any = {};
  handshake: any = { auth: {}, query: {} };
  rooms = new Set<string>();
  connected = true;

  constructor(userId?: string) {
    this.data.userId = userId;
  }

  join = jest.fn();
  leave = jest.fn();
  emit = jest.fn();
  disconnect = jest.fn();
  to = jest.fn().mockReturnThis();
}

class MockServer {
  emit = jest.fn();
  to = jest.fn().mockReturnValue({ emit: jest.fn() });
}

describe('ChatGateway', () => {
  let gateway: ChatGateway;
  let jwtService: jest.Mocked<JwtService>;
  let chatService: jest.Mocked<ChatService>;
  let chatPresence: jest.Mocked<ChatPresenceService>;
  let chatAnalytics: jest.Mocked<ChatAnalyticsService>;
  let prisma: any;

  beforeEach(async () => {
    prisma = {
      conversationParticipant: { findMany: jest.fn(), findUnique: jest.fn(), updateMany: jest.fn() },
      companyOwner: { findFirst: jest.fn() },
    };
    jwtService = { verify: jest.fn(), sign: jest.fn() } as any;
    chatService = {
      sendMessage: jest.fn(),
      deleteMessage: jest.fn(),
      markAsSeen: jest.fn(),
    } as any;
    chatPresence = { setOnline: jest.fn(), setOffline: jest.fn() } as any;
    chatAnalytics = { trackEvent: jest.fn() } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ChatGateway,
        { provide: JwtService, useValue: jwtService },
        { provide: PrismaService, useValue: prisma },
        { provide: ChatService, useValue: chatService },
        { provide: ChatPresenceService, useValue: chatPresence },
        { provide: ChatAnalyticsService, useValue: chatAnalytics },
      ],
    }).compile();

    gateway = module.get<ChatGateway>(ChatGateway);
    gateway.server = new MockServer() as any;
  });

  describe('handleConnection', () => {
    it('should disconnect without token', async () => {
      const socket = new MockSocket();
      await gateway.handleConnection(socket as any);
      expect(socket.disconnect).toHaveBeenCalled();
    });

    it('should disconnect with invalid token', async () => {
      const socket = new MockSocket();
      socket.handshake.auth = { token: 'bad-token' };
      jwtService.verify.mockImplementation(() => { throw new Error('invalid'); });

      await gateway.handleConnection(socket as any);
      expect(socket.disconnect).toHaveBeenCalled();
    });

    it('should connect with valid token', async () => {
      const socket = new MockSocket();
      socket.handshake.auth = { token: 'good-token' };
      jwtService.verify.mockReturnValue({ sub: 'u1' });
      prisma.conversationParticipant.findMany.mockResolvedValue([]);

      await gateway.handleConnection(socket as any);
      expect(socket.join).toHaveBeenCalledWith('user:u1');
    });
  });

  describe('handleDisconnect', () => {
    it('should emit offline when last socket disconnects', async () => {
      const socket = new MockSocket();
      socket.handshake.auth = { token: 'good-token' };
      jwtService.verify.mockReturnValue({ sub: 'u1' });
      prisma.conversationParticipant.findMany.mockResolvedValue([]);
      gateway.server.emit = jest.fn();

      await gateway.handleConnection(socket as any);
      await gateway.handleDisconnect(socket as any);
      expect(gateway.server.emit).toHaveBeenCalledWith('presence:offline', { userId: 'u1' });
    });
  });

  describe('handleSendMessage', () => {
    it('should send message and broadcast', async () => {
      const socket = new MockSocket('u1');
      jwtService.verify.mockReturnValue({ sub: 'u1' });
      prisma.conversationParticipant.findMany.mockResolvedValue([]);
      await gateway.handleConnection(socket as any);

      prisma.companyOwner.findFirst.mockResolvedValue({ companyId: 'c1' });
      chatService.sendMessage.mockResolvedValue({
        message: { id: 'm1', attachments: [], replyTo: null },
        recipientUserIds: ['u2'],
        filterResult: { hasPhone: false, hasEmail: false, hasProfanity: false },
      } as any);

      await gateway.handleSendMessage(socket as any, { conversationId: 'conv-1', content: 'hello' });

      expect(chatService.sendMessage).toHaveBeenCalled();
    });
  });

  describe('handleJoinConversation', () => {
    it('should join conversation if participant', async () => {
      const socket = new MockSocket('u1');
      prisma.conversationParticipant.findUnique.mockResolvedValue({ userId: 'u1', leftAt: null });

      await gateway.handleJoinConversation(socket as any, { conversationId: 'conv-1' });
      expect(socket.join).toHaveBeenCalledWith('conversation:conv-1');
    });

    it('should reject if not participant', async () => {
      const socket = new MockSocket('u1');
      prisma.conversationParticipant.findUnique.mockResolvedValue(null);

      await gateway.handleJoinConversation(socket as any, { conversationId: 'conv-1' });
      expect(socket.emit).toHaveBeenCalledWith('error', { message: 'Access denied to conversation' });
    });
  });

  describe('handleMarkSeen', () => {
    it('should mark as seen and broadcast', async () => {
      const socket = new MockSocket('u1');
      await gateway.handleMarkSeen(socket as any, { conversationId: 'conv-1', messageId: 'm1' });
      expect(chatService.markAsSeen).toHaveBeenCalledWith('conv-1', 'm1', 'u1');
    });
  });

  describe('typing indicators', () => {
    it('should emit typing:start', async () => {
      const socket = new MockSocket('u1');
      const mockTo = { emit: jest.fn() };
      socket.to = jest.fn().mockReturnValue(mockTo);

      await gateway.handleTypingStart(socket as any, { conversationId: 'conv-1' });
      expect(mockTo.emit).toHaveBeenCalledWith('typing:update', { conversationId: 'conv-1', userId: 'u1', isTyping: true });
    });

    it('should emit typing:stop', async () => {
      const socket = new MockSocket('u1');
      const mockTo = { emit: jest.fn() };
      socket.to = jest.fn().mockReturnValue(mockTo);

      await gateway.handleTypingStop(socket as any, { conversationId: 'conv-1' });
      expect(mockTo.emit).toHaveBeenCalledWith('typing:update', { conversationId: 'conv-1', userId: 'u1', isTyping: false });
    });
  });
});
