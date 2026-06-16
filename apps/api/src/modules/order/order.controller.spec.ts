import { Test, TestingModule } from '@nestjs/testing';
import { OrderController } from './order.controller';
import { OrderService } from './order.service';

describe('OrderController', () => {
  let controller: OrderController;
  let service: jest.Mocked<OrderService>;

  const mockService = {
    create: jest.fn(),
    findByBuyer: jest.fn(),
    findBySeller: jest.fn(),
    findById: jest.fn(),
    updateOrder: jest.fn(),
    updateStatus: jest.fn(),
    cancelOrder: jest.fn(),
    requestReturn: jest.fn(),
    reviewReturn: jest.fn(),
    getTimeline: jest.fn(),
    uploadDocument: jest.fn(),
    getDocuments: jest.fn(),
    dispatchLocation: jest.fn(),
    deliverLocation: jest.fn(),
    getLocationStatus: jest.fn(),
    getAnalytics: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [OrderController],
      providers: [{ provide: OrderService, useValue: mockService }],
    }).compile();

    controller = module.get<OrderController>(OrderController);
    service = module.get(OrderService);
  });

  afterEach(() => jest.clearAllMocks());

  it('create', async () => {
    const dto = {
      source: 'DIRECT', type: 'PRODUCT', sellerCompanyId: 's1', subtotal: 1000, totalAmount: 1180, quantity: 10,
      items: [{ productName: 'Widget', quantity: 10, unitPrice: 100 }],
    };
    mockService.create.mockResolvedValue({ id: 'order-1' });
    const result = await controller.create('c1', dto as any, 'u1');
    expect(service.create).toHaveBeenCalledWith('c1', 'u1', dto);
    expect(result.id).toBe('order-1');
  });

  it('findByBuyer', async () => {
    mockService.findByBuyer.mockResolvedValue({ data: [], meta: { total: 0, page: 1, limit: 20, totalPages: 0 } });
    const result = await controller.findByBuyer('c1');
    expect(service.findByBuyer).toHaveBeenCalledWith('c1', undefined, 1, 20);
  });

  it('findBySeller', async () => {
    mockService.findBySeller.mockResolvedValue({ data: [], meta: { total: 0, page: 1, limit: 20, totalPages: 0 } });
    await controller.findBySeller('c1');
    expect(service.findBySeller).toHaveBeenCalledWith('c1', undefined, 1, 20);
  });

  it('getAnalytics', async () => {
    mockService.getAnalytics.mockResolvedValue({ totalOrders: 10, revenue: 50000 });
    const result = await controller.getAnalytics('c1');
    expect(service.getAnalytics).toHaveBeenCalledWith('c1');
    expect(result.revenue).toBe(50000);
  });

  it('findById', async () => {
    mockService.findById.mockResolvedValue({ id: 'order-1' });
    await controller.findById('c1', 'order-1');
    expect(service.findById).toHaveBeenCalledWith('order-1', 'c1');
  });

  it('updateOrder', async () => {
    const dto = { title: 'Updated' };
    mockService.updateOrder.mockResolvedValue({ id: 'order-1', title: 'Updated' });
    await controller.updateOrder('c1', 'order-1', dto as any, 'u1');
    expect(service.updateOrder).toHaveBeenCalledWith('order-1', 'c1', 'u1', dto);
  });

  it('confirm', async () => {
    mockService.updateStatus.mockResolvedValue({ id: 'order-1', status: 'CONFIRMED' });
    await controller.confirm('c1', 'order-1', 'u1');
    expect(service.updateStatus).toHaveBeenCalledWith('order-1', 'c1', 'u1', 'CONFIRMED');
  });

  it('cancel', async () => {
    const dto = { reason: 'BUYER_REQUEST' };
    mockService.cancelOrder.mockResolvedValue({ id: 'order-1', status: 'CANCELLED' });
    await controller.cancel('c1', 'order-1', dto as any, 'u1');
    expect(service.cancelOrder).toHaveBeenCalledWith('order-1', 'c1', 'u1', dto);
  });

  it('getTimeline', async () => {
    mockService.getTimeline.mockResolvedValue([{ id: 'evt-1', toStatus: 'PENDING' }]);
    const result = await controller.getTimeline('c1', 'order-1');
    expect(service.getTimeline).toHaveBeenCalledWith('order-1', 'c1');
  });

  it('uploadDocument', async () => {
    const dto = { docType: 'INVOICE', fileName: 'inv.pdf', fileUrl: 'https://url' };
    mockService.uploadDocument.mockResolvedValue({ id: 'doc-1' });
    await controller.uploadDocument('c1', 'order-1', dto as any, 'u1');
    expect(service.uploadDocument).toHaveBeenCalledWith('order-1', 'c1', 'u1', dto);
  });

  it('dispatchLocation', async () => {
    mockService.dispatchLocation.mockResolvedValue({ id: 'loc-1', deliveryStatus: 'DISPATCHED' });
    await controller.dispatchLocation('c1', 'order-1', 'loc-1', 'u1');
    expect(service.dispatchLocation).toHaveBeenCalledWith('order-1', 'loc-1', 'c1', 'u1');
  });

  it('deliverLocation', async () => {
    mockService.deliverLocation.mockResolvedValue({ id: 'loc-1', deliveryStatus: 'DELIVERED' });
    await controller.deliverLocation('c1', 'order-1', 'loc-1', 'u1');
    expect(service.deliverLocation).toHaveBeenCalledWith('order-1', 'loc-1', 'c1', 'u1');
  });

  it('getLocationStatus', async () => {
    mockService.getLocationStatus.mockResolvedValue([{ id: 'loc-1', deliveryStatus: 'PENDING' }]);
    await controller.getLocationStatus('c1', 'order-1');
    expect(service.getLocationStatus).toHaveBeenCalledWith('order-1', 'c1');
  });
});
