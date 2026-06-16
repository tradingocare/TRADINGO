import { Test, TestingModule } from '@nestjs/testing';
import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';
import { ChatAnalyticsService } from './chat-analytics.service';

describe('ChatController', () => {
  let controller: ChatController;
  let service: jest.Mocked<ChatService>;
  let analytics: jest.Mocked<ChatAnalyticsService>;

  const mockService = {
    getConversations: jest.fn(),
    createConversation: jest.fn(),
    getOrCreateRfqConversation: jest.fn(),
    getConversationById: jest.fn(),
    getMessages: jest.fn(),
    sendMessage: jest.fn(),
    archiveConversation: jest.fn(),
    deleteMessage: jest.fn(),
    markAsSeen: jest.fn(),
    searchMessages: jest.fn(),
    blockUser: jest.fn(),
    reportMessage: jest.fn(),
    getUnreadCount: jest.fn(),
    generateUploadUrl: jest.fn(),
  };

  const mockAnalytics = {
    trackEvent: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ChatController],
      providers: [
        { provide: ChatService, useValue: mockService },
        { provide: ChatAnalyticsService, useValue: mockAnalytics },
      ],
    }).compile();

    controller = module.get<ChatController>(ChatController);
    service = module.get(ChatService);
    analytics = module.get(ChatAnalyticsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('getConversations', async () => {
    mockService.getConversations.mockResolvedValue({ data: [], meta: { total: 0, page: 1, limit: 20, totalPages: 0 } });
    const result = await controller.getConversations('c1', 'u1', 1, 20);
    expect(service.getConversations).toHaveBeenCalledWith('c1', 'u1', 1, 20);
    expect(result.meta.total).toBe(0);
  });

  it('createConversation', async () => {
    const dto = { type: 'DIRECT' as const, participantCompanyIds: ['c2'] };
    mockService.createConversation.mockResolvedValue({ id: 'conv-1' });
    const result = await controller.createConversation('c1', 'u1', dto);
    expect(service.createConversation).toHaveBeenCalledWith('c1', 'u1', dto);
    expect(result.id).toBe('conv-1');
  });

  it('getOrCreateRfqConversation', async () => {
    mockService.getOrCreateRfqConversation.mockResolvedValue({ id: 'conv-1', createdAt: new Date() });
    const result = await controller.getOrCreateRfqConversation('c1', 'rfq-1', 'u1');
    expect(service.getOrCreateRfqConversation).toHaveBeenCalledWith('c1', 'rfq-1', 'u1');
  });

  it('getOrCreateRfqConversation tracks analytics for new conversations', async () => {
    const now = Date.now();
    mockService.getOrCreateRfqConversation.mockResolvedValue({ id: 'conv-1', createdAt: new Date(now + 50) });
    jest.spyOn(Date, 'now').mockReturnValue(now);
    const result = await controller.getOrCreateRfqConversation('c1', 'rfq-1', 'u1');
    expect(analytics.trackEvent).toHaveBeenCalledWith('RFQ_NEGOTIATION_STARTED', 'c1', 'u1', {
      rfqId: 'rfq-1', conversationId: 'conv-1',
    });
  });

  it('getConversationById', async () => {
    mockService.getConversationById.mockResolvedValue({ id: 'conv-1' });
    const result = await controller.getConversationById('conv-1', 'u1');
    expect(service.getConversationById).toHaveBeenCalledWith('conv-1', 'u1');
  });

  it('getMessages', async () => {
    mockService.getMessages.mockResolvedValue({ data: [], nextCursor: null });
    const result = await controller.getMessages('conv-1', 'u1', 'cursor-1', 50);
    expect(service.getMessages).toHaveBeenCalledWith('conv-1', 'u1', 'cursor-1', 50);
  });

  it('sendMessage', async () => {
    const dto = { content: 'hello' };
    mockService.sendMessage.mockResolvedValue({ message: { id: 'm1' }, recipientUserIds: ['u2'], filterResult: {} });
    const result = await controller.sendMessage('c1', 'conv-1', 'u1', dto);
    expect(service.sendMessage).toHaveBeenCalledWith('conv-1', 'c1', 'u1', dto);
  });

  it('archiveConversation', async () => {
    mockService.archiveConversation.mockResolvedValue({ message: 'Archived' });
    const result = await controller.archiveConversation('conv-1', 'u1');
    expect(service.archiveConversation).toHaveBeenCalledWith('conv-1', 'u1');
  });

  it('deleteMessage', async () => {
    mockService.deleteMessage.mockResolvedValue({ message: 'Deleted' });
    const result = await controller.deleteMessage('conv-1', 'm1', 'u1');
    expect(service.deleteMessage).toHaveBeenCalledWith('conv-1', 'm1', 'u1');
  });

  it('markAsSeen', async () => {
    mockService.markAsSeen.mockResolvedValue({ message: 'Seen' });
    const result = await controller.markAsSeen('conv-1', 'm1', 'u1');
    expect(service.markAsSeen).toHaveBeenCalledWith('conv-1', 'm1', 'u1');
  });

  it('searchMessages', async () => {
    const query = { q: 'test', page: 1, limit: 20 };
    mockService.searchMessages.mockResolvedValue({ data: [], meta: { total: 0, page: 1, limit: 20, totalPages: 0 } });
    const result = await controller.searchMessages('c1', 'u1', query);
    expect(service.searchMessages).toHaveBeenCalledWith('c1', 'u1', query);
  });

  it('blockUser', async () => {
    mockService.blockUser.mockResolvedValue({ message: 'Blocked' });
    const result = await controller.blockUser('c1', 'conv-1', 'u2', 'u1', 'spam');
    expect(service.blockUser).toHaveBeenCalledWith('conv-1', 'u2', 'u1', 'spam');
    expect(analytics.trackEvent).toHaveBeenCalledWith('USER_BLOCKED', 'c1', 'u1', {
      conversationId: 'conv-1', blockedUserId: 'u2', reason: 'spam',
    });
  });

  it('reportMessage', async () => {
    const dto = { reason: 'spam' };
    mockService.reportMessage.mockResolvedValue({ message: 'Reported' });
    const result = await controller.reportMessage('c1', 'conv-1', 'm1', 'u1', dto);
    expect(service.reportMessage).toHaveBeenCalledWith('conv-1', 'm1', 'u1', dto);
    expect(analytics.trackEvent).toHaveBeenCalledWith('REPORT_CREATED', 'c1', 'u1', {
      conversationId: 'conv-1', messageId: 'm1', reason: 'spam',
    });
  });

  it('getUnreadCount', async () => {
    mockService.getUnreadCount.mockResolvedValue({ totalUnread: 5 });
    const result = await controller.getUnreadCount('u1');
    expect(service.getUnreadCount).toHaveBeenCalledWith('u1');
    expect(result.totalUnread).toBe(5);
  });

  it('generateUploadUrl', async () => {
    const dto = { fileName: 'test.pdf', mimeType: 'application/pdf', fileSize: 1024 };
    mockService.generateUploadUrl.mockResolvedValue({ key: 'test-key', presignedUrl: 'https://presigned.url', cdnUrl: 'https://cdn.url/test-key' });
    const result = await controller.generateUploadUrl('c1', 'u1', dto);
    expect(service.generateUploadUrl).toHaveBeenCalledWith('c1', 'u1', 'test.pdf', 'application/pdf', 1024);
    expect(result.presignedUrl).toBe('https://presigned.url');
  });
});
