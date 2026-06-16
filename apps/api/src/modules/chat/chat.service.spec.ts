import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { ChatService } from './chat.service';
import { PrismaService } from '../../prisma/prisma.service';
import { ChatFilterService } from './chat-filter.service';
import { StorageService } from '../storage/storage.service';

const makePrisma = () => {
  const prisma = {
    conversation: { findUnique: jest.fn(), findMany: jest.fn(), findFirst: jest.fn(), create: jest.fn(), update: jest.fn(), count: jest.fn() },
    conversationParticipant: { findUnique: jest.fn(), findMany: jest.fn(), update: jest.fn(), updateMany: jest.fn(), count: jest.fn() },
    message: { findUnique: jest.fn(), findMany: jest.fn(), create: jest.fn(), update: jest.fn(), count: jest.fn() },
    messageAttachment: { findMany: jest.fn() },
    blockedUser: { findUnique: jest.fn(), create: jest.fn() },
    reportedMessage: { create: jest.fn() },
    companyOwner: { findMany: jest.fn(), findFirst: jest.fn() },
    rfq: { findFirst: jest.fn() },
    rfqVendorMatch: { findMany: jest.fn() },
  };
  return prisma;
};

describe('ChatService', () => {
  let service: ChatService;
  let prisma: ReturnType<typeof makePrisma>;
  let filterService: ChatFilterService;

  beforeEach(async () => {
    prisma = makePrisma();
    filterService = new ChatFilterService();
    const storageService = { generatePresignedUrl: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ChatService,
        { provide: PrismaService, useValue: prisma },
        { provide: ChatFilterService, useValue: filterService },
        { provide: StorageService, useValue: storageService },
      ],
    }).compile();

    service = module.get<ChatService>(ChatService);
  });

  // ---------------------------------------------------------------------------
  // CREATE CONVERSATION
  // ---------------------------------------------------------------------------
  describe('createConversation', () => {
    it('should throw if RFQ ID missing for RFQ_NEGOTIATION', async () => {
      await expect(service.createConversation('c1', 'u1', { type: 'RFQ_NEGOTIATION', participantCompanyIds: ['c1', 'c2'] } as any))
        .rejects.toThrow(BadRequestException);
    });

    it('should throw if DIRECT conversation has != 2 participants', async () => {
      await expect(service.createConversation('c1', 'u1', { type: 'DIRECT', participantCompanyIds: ['c1', 'c2', 'c3'] } as any))
        .rejects.toThrow(BadRequestException);
    });

    it('should throw if RFQ not found', async () => {
      prisma.rfq.findFirst.mockResolvedValue(null);
      await expect(service.createConversation('c1', 'u1', { type: 'RFQ_NEGOTIATION', rfqId: 'rfq-1', participantCompanyIds: ['c1', 'c2'] } as any))
        .rejects.toThrow(NotFoundException);
    });

    it('should throw if user is not an owner of any participant company', async () => {
      prisma.companyOwner.findMany.mockResolvedValue([{ userId: 'u2', companyId: 'c2' }]);
      await expect(service.createConversation('c1', 'u1', { type: 'DIRECT', participantCompanyIds: ['c2'] } as any))
        .rejects.toThrow(ForbiddenException);
    });

    it('should create conversation successfully', async () => {
      prisma.companyOwner.findMany.mockResolvedValue([{ userId: 'u1', companyId: 'c1' }, { userId: 'u2', companyId: 'c2' }]);
      prisma.conversation.findMany.mockResolvedValue([]);
      prisma.conversation.create.mockResolvedValue({ id: 'conv-1', participants: [{ userId: 'u1', companyId: 'c1' }, { userId: 'u2', companyId: 'c2' }] });

      const result = await service.createConversation('c1', 'u1', { type: 'DIRECT', participantCompanyIds: ['c2'] });

      expect(result.id).toBe('conv-1');
    });
  });

  // ---------------------------------------------------------------------------
  // GET CONVERSATIONS
  // ---------------------------------------------------------------------------
  describe('getConversations', () => {
    it('should return paginated conversations with unread count', async () => {
      prisma.conversation.findMany.mockResolvedValue([{
        id: 'conv-1', type: 'DIRECT', title: null, rfqId: null, orderId: null, createdBy: 'u1',
        createdAt: new Date(), updatedAt: new Date(),
        participants: [{ userId: 'u1', companyId: 'c1', lastReadAt: new Date(), role: 'MEMBER', company: { id: 'c1', name: 'A', slug: 'a', logo: null } }],
        messages: [{ id: 'm1', content: 'hello', createdAt: new Date(), attachments: [] }],
        _count: { messages: 3 },
      }]);
      prisma.conversation.count.mockResolvedValue(1);
      prisma.conversationParticipant.findUnique.mockResolvedValue({ lastReadAt: new Date() });
      prisma.message.count.mockResolvedValue(0);

      const result = await service.getConversations('c1', 'u1');

      expect(result.data).toHaveLength(1);
      expect(result.meta.total).toBe(1);
    });
  });

  // ---------------------------------------------------------------------------
  // GET CONVERSATION BY ID
  // ---------------------------------------------------------------------------
  describe('getConversationById', () => {
    it('should throw if not found', async () => {
      prisma.conversation.findUnique.mockResolvedValue(null);
      await expect(service.getConversationById('conv-1', 'u1')).rejects.toThrow(NotFoundException);
    });

    it('should throw if user not participant', async () => {
      prisma.conversation.findUnique.mockResolvedValue({
        id: 'conv-1',
        participants: [{ userId: 'u2' }],
      } as any);
      await expect(service.getConversationById('conv-1', 'u1')).rejects.toThrow(ForbiddenException);
    });
  });

  // ---------------------------------------------------------------------------
  // ARCHIVE
  // ---------------------------------------------------------------------------
  describe('archiveConversation', () => {
    it('should archive and return message', async () => {
      prisma.conversation.findUnique.mockResolvedValue({ id: 'conv-1', participants: [{ userId: 'u1' }] } as any);
      prisma.conversationParticipant.findUnique.mockResolvedValue({ conversationId: 'conv-1', userId: 'u1' });
      const result = await service.archiveConversation('conv-1', 'u1');
      expect(result.message).toBe('Conversation archived');
    });

    it('should throw if not participant', async () => {
      prisma.conversation.findUnique.mockResolvedValue({ id: 'conv-1', participants: [] } as any);
      await expect(service.archiveConversation('conv-1', 'u1')).rejects.toThrow(ForbiddenException);
    });
  });

  // ---------------------------------------------------------------------------
  // GET MESSAGES
  // ---------------------------------------------------------------------------
  describe('getMessages', () => {
    it('should return paginated messages', async () => {
      prisma.conversation.findUnique.mockResolvedValue({ id: 'conv-1', participants: [{ userId: 'u1' }] } as any);
      prisma.message.findMany.mockResolvedValue([{ id: 'm1', content: 'hello', attachments: [], replyTo: null }]);

      const result = await service.getMessages('conv-1', 'u1');
      expect(result.data).toHaveLength(1);
    });

    it('should throw if not participant', async () => {
      prisma.conversation.findUnique.mockResolvedValue({ id: 'conv-1', participants: [] } as any);
      await expect(service.getMessages('conv-1', 'u1')).rejects.toThrow(ForbiddenException);
    });
  });

  // ---------------------------------------------------------------------------
  // SEND MESSAGE
  // ---------------------------------------------------------------------------
  describe('sendMessage', () => {
    it('should throw if conversation not found', async () => {
      prisma.conversation.findUnique.mockResolvedValue(null);
      await expect(service.sendMessage('conv-1', 'c1', 'u1', { content: 'hello' })).rejects.toThrow(NotFoundException);
    });

    it('should throw if user not participant', async () => {
      prisma.conversation.findUnique.mockResolvedValue({ id: 'conv-1', participants: [], blockedUsers: [] } as any);
      await expect(service.sendMessage('conv-1', 'c1', 'u1', { content: 'hello' })).rejects.toThrow(ForbiddenException);
    });

    it('should throw if no content or attachments', async () => {
      prisma.conversation.findUnique.mockResolvedValue({ id: 'conv-1', participants: [{ userId: 'u1', leftAt: null }], blockedUsers: [] } as any);
      await expect(service.sendMessage('conv-1', 'c1', 'u1', {} as any)).rejects.toThrow(BadRequestException);
    });

    it('should throw if attachments exceed max', async () => {
      const attachments = Array.from({ length: 11 }, (_, i) => ({ type: 'IMAGE', url: `u${i}`, fileSize: 1000 }));
      prisma.conversation.findUnique.mockResolvedValue({ id: 'conv-1', participants: [{ userId: 'u1', leftAt: null }], blockedUsers: [] } as any);
      await expect(service.sendMessage('conv-1', 'c1', 'u1', { content: 'hi', attachments })).rejects.toThrow(BadRequestException);
    });

    it('should send message successfully', async () => {
      prisma.conversation.findUnique.mockResolvedValue({ id: 'conv-1', participants: [{ userId: 'u1', leftAt: null }], blockedUsers: [] } as any);
      prisma.message.create.mockResolvedValue({ id: 'm1', content: 'hello', attachments: [], replyTo: null });
      prisma.conversationParticipant.findMany.mockResolvedValue([{ userId: 'u2' }]);

      const result = await service.sendMessage('conv-1', 'c1', 'u1', { content: 'hello' });

      expect(result.message.id).toBe('m1');
      expect(result.recipientUserIds).toEqual(['u2']);
    });
  });

  // ---------------------------------------------------------------------------
  // DELETE MESSAGE
  // ---------------------------------------------------------------------------
  describe('deleteMessage', () => {
    it('should soft delete own message', async () => {
      prisma.message.findUnique.mockResolvedValue({ id: 'm1', conversationId: 'conv-1', senderId: 'u1' });
      const result = await service.deleteMessage('conv-1', 'm1', 'u1');
      expect(result.message).toBe('Message deleted');
    });

    it('should throw if not own message', async () => {
      prisma.message.findUnique.mockResolvedValue({ id: 'm1', conversationId: 'conv-1', senderId: 'u2' });
      await expect(service.deleteMessage('conv-1', 'm1', 'u1')).rejects.toThrow(ForbiddenException);
    });
  });

  // ---------------------------------------------------------------------------
  // MARK AS SEEN
  // ---------------------------------------------------------------------------
  describe('markAsSeen', () => {
    it('should mark message as seen', async () => {
      prisma.message.findUnique.mockResolvedValue({ id: 'm1', conversationId: 'conv-1' });
      const result = await service.markAsSeen('conv-1', 'm1', 'u1');
      expect(result.message).toBe('Marked as seen');
    });
  });

  // ---------------------------------------------------------------------------
  // SEARCH MESSAGES
  // ---------------------------------------------------------------------------
  describe('searchMessages', () => {
    it('should search messages', async () => {
      prisma.conversation.findMany.mockResolvedValue([{ id: 'conv-1' }]);
      prisma.message.findMany.mockResolvedValue([{ id: 'm1', content: 'test', attachments: [], conversation: { id: 'conv-1', title: null, type: 'DIRECT' } }]);
      prisma.message.count.mockResolvedValue(1);

      const result = await service.searchMessages('c1', 'u1', { q: 'test', page: 1, limit: 20 });
      expect(result.data).toHaveLength(1);
    });
  });

  // ---------------------------------------------------------------------------
  // BLOCK USER
  // ---------------------------------------------------------------------------
  describe('blockUser', () => {
    it('should block user', async () => {
      prisma.conversation.findUnique.mockResolvedValue({ id: 'conv-1', participants: [{ userId: 'u1' }] } as any);
      prisma.conversationParticipant.findUnique.mockResolvedValue({ userId: 'u2' });
      prisma.blockedUser.findUnique.mockResolvedValue(null);

      const result = await service.blockUser('conv-1', 'u2', 'u1');
      expect(result.message).toBe('User blocked');
    });

    it('should throw if already blocked', async () => {
      prisma.conversation.findUnique.mockResolvedValue({ id: 'conv-1', participants: [{ userId: 'u1' }] } as any);
      prisma.conversationParticipant.findUnique.mockResolvedValue({ userId: 'u2' });
      prisma.blockedUser.findUnique.mockResolvedValue({ id: 'b1' });

      await expect(service.blockUser('conv-1', 'u2', 'u1')).rejects.toThrow(BadRequestException);
    });
  });

  // ---------------------------------------------------------------------------
  // REPORT MESSAGE
  // ---------------------------------------------------------------------------
  describe('reportMessage', () => {
    it('should report message', async () => {
      prisma.message.findUnique.mockResolvedValue({ id: 'm1', conversationId: 'conv-1' });
      const result = await service.reportMessage('conv-1', 'm1', 'u1', { reason: 'spam' });
      expect(result.message).toBe('Message reported');
    });
  });

  // ---------------------------------------------------------------------------
  // GET UNREAD COUNT
  // ---------------------------------------------------------------------------
  describe('getUnreadCount', () => {
    it('should return total unread count', async () => {
      prisma.conversation.findMany.mockResolvedValue([{ id: 'conv-1' }]);
      prisma.conversationParticipant.findUnique.mockResolvedValue({ lastReadAt: new Date() });
      prisma.message.count.mockResolvedValue(2);

      const result = await service.getUnreadCount('u1');
      expect(result.totalUnread).toBe(2);
    });
  });

  // ---------------------------------------------------------------------------
  // GET OR CREATE RFQ CONVERSATION
  // ---------------------------------------------------------------------------
  describe('getOrCreateRfqConversation', () => {
    it('should return existing RFQ conversation', async () => {
      prisma.rfq.findFirst.mockResolvedValue({ id: 'rfq-1', companyId: 'c1' } as any);
      prisma.conversation.findFirst.mockResolvedValue({ id: 'conv-1', participants: [{ userId: 'u1' }] } as any);
      const result = await service.getOrCreateRfqConversation('c1', 'rfq-1', 'u1');
      expect(result.id).toBe('conv-1');
    });

    it('should throw if RFQ not found', async () => {
      prisma.conversation.findFirst.mockResolvedValue(null);
      prisma.rfq.findFirst.mockResolvedValue(null);
      await expect(service.getOrCreateRfqConversation('c1', 'rfq-1', 'u1')).rejects.toThrow(NotFoundException);
    });
  });
});
