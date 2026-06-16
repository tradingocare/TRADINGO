import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { OrderService } from './order.service';
import { PrismaService } from '../../prisma/prisma.service';
import { OrderNumberService } from './order-number.service';
import { OrderTimelineService } from './order-timeline.service';
import { OrderDocumentService } from './order-document.service';
import { OrderAnalyticsService } from './order-analytics.service';
import { ChatService } from '../chat/chat.service';

const mockPrisma = () => ({
  company: { findFirst: jest.fn() },
  companyOwner: { findMany: jest.fn() },
  companyLocation: { findFirst: jest.fn() },
  order: {
    create: jest.fn(),
    findUnique: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn(),
    count: jest.fn(),
    aggregate: jest.fn(),
  },
  orderItem: { create: jest.fn(), aggregate: jest.fn(), updateMany: jest.fn() },
  orderLocation: { findUnique: jest.fn(), findMany: jest.fn(), update: jest.fn(), count: jest.fn() },
  orderNumberCounter: { upsert: jest.fn() },
  orderTimelineEvent: { create: jest.fn(), findMany: jest.fn() },
  orderDocument: { findMany: jest.fn(), findFirst: jest.fn(), create: jest.fn(), delete: jest.fn() },
  orderCancellation: { create: jest.fn() },
  orderReturn: { findUnique: jest.fn(), create: jest.fn(), update: jest.fn() },
  orderAnalyticsEvent: { create: jest.fn(), createMany: jest.fn() },
  $transaction: jest.fn(),
});

describe('OrderService', () => {
  let service: OrderService;
  let prisma: ReturnType<typeof mockPrisma>;
  let orderNumberService: jest.Mocked<OrderNumberService>;
  let timelineService: jest.Mocked<OrderTimelineService>;
  let chatService: jest.Mocked<ChatService>;

  beforeEach(async () => {
    prisma = mockPrisma();
    orderNumberService = { generate: jest.fn() } as any;
    timelineService = { addEvent: jest.fn(), getTimeline: jest.fn() } as any;
    const documentService = { upload: jest.fn(), getDocuments: jest.fn(), deleteDocument: jest.fn() } as any;
    const analytics = { trackEvent: jest.fn(), getOrderMetrics: jest.fn() } as any;
    chatService = { createConversation: jest.fn() } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrderService,
        { provide: PrismaService, useValue: prisma },
        { provide: OrderNumberService, useValue: orderNumberService },
        { provide: OrderTimelineService, useValue: timelineService },
        { provide: OrderDocumentService, useValue: documentService },
        { provide: OrderAnalyticsService, useValue: analytics },
        { provide: ChatService, useValue: chatService },
      ],
    }).compile();

    service = module.get<OrderService>(OrderService);
  });

  describe('create', () => {
    const dto = {
      source: 'DIRECT' as any,
      type: 'PRODUCT' as any,
      sellerCompanyId: 'seller-1',
      subtotal: 1000,
      totalAmount: 1180,
      quantity: 10,
      items: [{ productName: 'Widget', quantity: 10, unitPrice: 100 }],
    };

    it('should throw if seller not found', async () => {
      prisma.company.findFirst.mockResolvedValue(null);
      await expect(service.create('buyer-1', 'u1', dto as any)).rejects.toThrow(NotFoundException);
    });

    it('should return existing order for duplicate idempotencyKey', async () => {
      prisma.order.findUnique.mockResolvedValue({ id: 'existing-order' });
      const result = await service.create('buyer-1', 'u1', { ...dto, idempotencyKey: 'key-1' } as any);
      expect(result).toEqual({ id: 'existing-order' });
    });

    it('should create order successfully', async () => {
      prisma.company.findFirst.mockResolvedValue({ id: 'seller-1' });
      prisma.companyLocation.findFirst.mockResolvedValue({ state: 'Delhi' });
      orderNumberService.generate.mockResolvedValue('TRD-DL-260613-0001');
      prisma.companyOwner.findMany.mockResolvedValue([{ userId: 'u1', companyId: 'buyer-1' }, { userId: 'u2', companyId: 'seller-1' }]);
      prisma.$transaction.mockImplementation(async (cb: any) => cb(prisma));
      prisma.order.create.mockResolvedValue({ id: 'order-1', orderNumber: 'TRD-DL-260613-0001', items: [], locations: [] });

      const result = await service.create('buyer-1', 'u1', dto as any);
      expect(result.id).toBe('order-1');
      expect(timelineService.addEvent).toHaveBeenCalledWith('order-1', 'PENDING', 'u1', 'BUYER');
      expect(chatService.createConversation).toHaveBeenCalled();
    });

    it('should not fail if chat room creation fails', async () => {
      prisma.company.findFirst.mockResolvedValue({ id: 'seller-1' });
      prisma.companyLocation.findFirst.mockResolvedValue({ state: 'Delhi' });
      orderNumberService.generate.mockResolvedValue('TRD-DL-260613-0001');
      prisma.companyOwner.findMany.mockResolvedValue([]);
      prisma.$transaction.mockImplementation(async (cb: any) => cb(prisma));
      prisma.order.create.mockResolvedValue({ id: 'order-1', orderNumber: 'TRD-DL-260613-0001', items: [], locations: [] });
      chatService.createConversation.mockRejectedValue(new Error('fail'));

      const result = await service.create('buyer-1', 'u1', dto as any);
      expect(result.id).toBe('order-1');
    });
  });

  describe('findByBuyer / findBySeller', () => {
    it('should return paginated orders for buyer', async () => {
      prisma.order.findMany.mockResolvedValue([]);
      prisma.order.count.mockResolvedValue(0);
      const result = await service.findByBuyer('buyer-1');
      expect(result.data).toEqual([]);
      expect(result.meta.total).toBe(0);
    });

    it('should filter by status', async () => {
      prisma.order.findMany.mockResolvedValue([]);
      prisma.order.count.mockResolvedValue(0);
      await service.findByBuyer('buyer-1', 'PENDING');
      expect(prisma.order.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: expect.objectContaining({ status: 'PENDING' }) }),
      );
    });
  });

  describe('findById', () => {
    it('should throw if order not found', async () => {
      prisma.order.findUnique.mockResolvedValue(null);
      await expect(service.findById('order-1', 'c1')).rejects.toThrow(NotFoundException);
    });

    it('should throw if access denied', async () => {
      prisma.order.findUnique.mockResolvedValue({ id: 'order-1', buyerCompanyId: 'c1', sellerCompanyId: 'c2', deletedAt: null });
      await expect(service.findById('order-1', 'c3')).rejects.toThrow(ForbiddenException);
    });

    it('should return order for buyer', async () => {
      const order = { id: 'order-1', buyerCompanyId: 'c1', sellerCompanyId: 'c2', deletedAt: null, items: [], locations: [], timeline: [], documents: [], cancellations: [], returns: [], buyerCompany: {}, sellerCompany: {} };
      prisma.order.findUnique.mockResolvedValue(order);
      const result = await service.findById('order-1', 'c1');
      expect(result.id).toBe('order-1');
    });
  });

  describe('updateStatus', () => {
    it('should throw on invalid transition', async () => {
      prisma.order.findUnique.mockResolvedValue({ id: 'order-1', buyerCompanyId: 'c1', sellerCompanyId: 'c2', deletedAt: null, status: 'PENDING' });
      await expect(service.updateStatus('order-1', 'c1', 'u1', 'DISPATCHED')).rejects.toThrow(BadRequestException);
    });

    it('should allow valid transition', async () => {
      prisma.order.findUnique.mockResolvedValue({ id: 'order-1', buyerCompanyId: 'c1', sellerCompanyId: 'c2', deletedAt: null, status: 'PENDING' });
      prisma.order.update.mockResolvedValue({ id: 'order-1', status: 'CONFIRMED' });
      const result = await service.updateStatus('order-1', 'c2', 'u1', 'CONFIRMED');
      expect(result.status).toBe('CONFIRMED');
    });

    it('should require buyer role for delivery confirmation', async () => {
      prisma.order.findUnique.mockResolvedValue({ id: 'order-1', buyerCompanyId: 'c1', sellerCompanyId: 'c2', deletedAt: null, status: 'DISPATCHED' });
      await expect(service.updateStatus('order-1', 'c2', 'u1', 'DELIVERED')).rejects.toThrow(ForbiddenException);
    });
  });

  describe('dispatchLocation / deliverLocation', () => {
    it('should dispatch a location', async () => {
      prisma.order.findUnique.mockResolvedValue({ id: 'order-1', buyerCompanyId: 'c1', sellerCompanyId: 'c2', deletedAt: null, status: 'PROCESSING' });
      prisma.orderLocation.findUnique.mockResolvedValue({ id: 'loc-1', orderId: 'order-1', deliveryStatus: 'PENDING', city: 'Mumbai' });
      prisma.orderLocation.update.mockResolvedValue({ id: 'loc-1', deliveryStatus: 'DISPATCHED' });
      const result = await service.dispatchLocation('order-1', 'loc-1', 'c2', 'u1');
      expect(result.deliveryStatus).toBe('DISPATCHED');
    });

    it('should deliver a location', async () => {
      prisma.order.findUnique.mockResolvedValue({ id: 'order-1', buyerCompanyId: 'c1', sellerCompanyId: 'c2', deletedAt: null, status: 'DISPATCHED' });
      prisma.orderLocation.findUnique.mockResolvedValue({ id: 'loc-1', orderId: 'order-1', deliveryStatus: 'DISPATCHED', city: 'Mumbai' });
      prisma.orderLocation.update.mockResolvedValue({ id: 'loc-1', deliveryStatus: 'DELIVERED' });
      prisma.orderLocation.count.mockResolvedValue(0);
      prisma.order.update.mockResolvedValue({ id: 'order-1', status: 'DELIVERED' });
      const result = await service.deliverLocation('order-1', 'loc-1', 'c1', 'u1');
      expect(result.deliveryStatus).toBe('DELIVERED');
    });
  });

  describe('cancelOrder', () => {
    const cancelDto = { reason: 'BUYER_REQUEST' as any };

    it('should cancel order and release reservation', async () => {
      prisma.order.findUnique.mockResolvedValue({ id: 'order-1', buyerCompanyId: 'c1', sellerCompanyId: 'c2', deletedAt: null, status: 'PENDING' });
      prisma.$transaction.mockImplementation(async (cb: any) => cb(prisma));
      prisma.order.update.mockResolvedValue({ id: 'order-1', status: 'CANCELLED' });
      const result = await service.cancelOrder('order-1', 'c1', 'u1', cancelDto);
      expect(result.status).toBe('CANCELLED');
      expect(prisma.orderItem.updateMany).toHaveBeenCalledWith(
        { where: { orderId: 'order-1' }, data: { reservedQuantity: 0 } },
      );
    });
  });

  describe('requestReturn / reviewReturn', () => {
    it('should throw if not delivered', async () => {
      prisma.order.findUnique.mockResolvedValue({ id: 'order-1', buyerCompanyId: 'c1', sellerCompanyId: 'c2', deletedAt: null, status: 'PENDING', deliveredAt: null, updatedAt: new Date() });
      await expect(service.requestReturn('order-1', 'c1', 'u1', { reason: 'QUALITY_ISSUE' } as any)).rejects.toThrow(BadRequestException);
    });

    it('should create return request', async () => {
      prisma.order.findUnique.mockResolvedValue({ id: 'order-1', buyerCompanyId: 'c1', sellerCompanyId: 'c2', deletedAt: null, status: 'DELIVERED', deliveredAt: new Date(), updatedAt: new Date() });
      prisma.orderReturn.create.mockResolvedValue({ id: 'return-1' });
      const result = await service.requestReturn('order-1', 'c1', 'u1', { reason: 'QUALITY_ISSUE' } as any);
      expect(result.id).toBe('return-1');
    });
  });

  describe('getLocationStatus', () => {
    it('should return location delivery statuses', async () => {
      prisma.order.findUnique.mockResolvedValue({ id: 'order-1', buyerCompanyId: 'c1', sellerCompanyId: 'c2', deletedAt: null });
      prisma.orderLocation.findMany.mockResolvedValue([{ id: 'loc-1', deliveryStatus: 'PENDING' }]);
      const result = await service.getLocationStatus('order-1', 'c1');
      expect(result).toHaveLength(1);
    });
  });
});
