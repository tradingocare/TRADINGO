import { Test, TestingModule } from '@nestjs/testing';
import { Prisma } from '@prisma/client';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { OrderService } from './order.service';
import { PrismaService } from '../../prisma/prisma.service';
import { OrderNumberService } from './order-number.service';
import { OrderTimelineService } from './order-timeline.service';
import { OrderDocumentService } from './order-document.service';
import { OrderAnalyticsService } from './order-analytics.service';
import { ChatService } from '../chat/chat.service';
import { NotificationService } from '../notification/notification.service';
import { ProductPricingService } from '../products/services/product-pricing.service';

const D = (v: string) => new Prisma.Decimal(v);

/**
 * R2 — server-authoritative order money.
 * Uses the REAL ProductPricingService (R1) together with the REAL
 * OrderService over a shared Prisma mock, proving end-to-end that
 * manipulated client money is replaced by server-derived values and
 * invalid purchases are rejected before any write.
 */
describe('OrderService server-authoritative money (R2 security)', () => {
  let service: OrderService;
  let prisma: Record<string, any>;
  let persisted: any;

  const slab = (id: string, minQty: number, maxQty: number | null, price: string, currency = 'INR') =>
    ({ id, minQty, maxQty, price: D(price), currency });

  const catalogProduct = (overrides: Record<string, any> = {}) => ({
    id: 'prod-1',
    slug: 'prod-1',
    name: 'Steel Coil',
    companyId: 'seller-1',
    moq: 1,
    maxOrderQty: null,
    priceSlabs: [slab('s1', 1, null, '100.00')],
    ...overrides,
  });

  let products: Record<string, any>;

  const baseDto = (items: any[], money: Record<string, any> = {}) => ({
    source: 'DIRECT' as any,
    type: 'PRODUCT' as any,
    sellerCompanyId: 'seller-1',
    quantity: 999,
    ...money,
    items,
  });

  beforeEach(async () => {
    persisted = undefined;
    products = { 'prod-1': catalogProduct() };
    prisma = {
      company: { findFirst: jest.fn().mockResolvedValue({ id: 'seller-1' }) },
      companyOwner: { findMany: jest.fn().mockResolvedValue([]) },
      companyLocation: { findFirst: jest.fn().mockResolvedValue({ state: 'MH' }) },
      product: { findFirst: jest.fn((args: any) => products[args?.where?.id] ?? null) },
      order: {
        create: jest.fn((args: any) => {
          persisted = args.data;
          return Promise.resolve({ id: 'order-1', orderNumber: 'TRD-TEST-0001', items: [], locations: [] });
        }),
        findUnique: jest.fn(),
      },
      $transaction: jest.fn((cb: any) => cb(prisma)),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrderService,
        ProductPricingService,
        { provide: PrismaService, useValue: prisma },
        { provide: OrderNumberService, useValue: { generate: jest.fn().mockResolvedValue('TRD-TEST-0001') } },
        { provide: OrderTimelineService, useValue: { addEvent: jest.fn(), getTimeline: jest.fn() } },
        { provide: OrderDocumentService, useValue: { upload: jest.fn(), getDocuments: jest.fn() } },
        { provide: OrderAnalyticsService, useValue: { trackEvent: jest.fn(), getOrderMetrics: jest.fn() } },
        { provide: ChatService, useValue: { createConversation: jest.fn() } },
        { provide: NotificationService, useValue: { createWithTemplate: jest.fn().mockResolvedValue(undefined) } },
      ],
    }).compile();

    service = module.get(OrderService);
  });

  it('1. client sends Rs.1 for a Rs.10,000 product -> persisted order total is the server amount', async () => {
    products['prod-1'] = catalogProduct({ priceSlabs: [slab('s1', 1, null, '10000.00')] });
    const dto = baseDto(
      [{ productId: 'prod-1', productName: 'Steel Coil', quantity: 2, unitPrice: 1 }],
      { subtotal: 2, totalAmount: 2 },
    );
    await service.create('buyer-1', 'u1', dto as any);
    expect(Number(persisted.subtotal)).toBe(20000);
    expect(Number(persisted.totalAmount)).toBe(20000);
    expect(Number(persisted.items.create[0].unitPrice)).toBe(10000);
    expect(Number(persisted.items.create[0].totalPrice)).toBe(20000);
  });

  it('2. inflated client unitPrice is ignored', async () => {
    const dto = baseDto(
      [{ productId: 'prod-1', productName: 'Steel Coil', quantity: 1, unitPrice: 99999 }],
      { subtotal: 99999, totalAmount: 99999 },
    );
    await service.create('buyer-1', 'u1', dto as any);
    expect(Number(persisted.items.create[0].unitPrice)).toBe(100);
  });

  it('3. manipulated client subtotal is ignored', async () => {
    const dto = baseDto(
      [{ productId: 'prod-1', productName: 'Steel Coil', quantity: 2, unitPrice: 100 }],
      { subtotal: 5, totalAmount: 200 },
    );
    await service.create('buyer-1', 'u1', dto as any);
    expect(Number(persisted.subtotal)).toBe(200);
  });

  it('4. manipulated client totalAmount is ignored', async () => {
    const dto = baseDto(
      [{ productId: 'prod-1', productName: 'Steel Coil', quantity: 2, unitPrice: 100 }],
      { subtotal: 200, totalAmount: 7 },
    );
    await service.create('buyer-1', 'u1', dto as any);
    expect(Number(persisted.totalAmount)).toBe(200);
  });

  it('5. incorrect item unitPrice is replaced by the server slab price', async () => {
    const dto = baseDto([{ productId: 'prod-1', productName: 'Steel Coil', quantity: 2, unitPrice: 50 }]);
    await service.create('buyer-1', 'u1', dto as any);
    expect(Number(persisted.items.create[0].unitPrice)).toBe(100);
    expect(Number(persisted.items.create[0].totalPrice)).toBe(200);
  });

  it('6. quantity change selects the correct server slab price', async () => {
    products['prod-1'] = catalogProduct({
      priceSlabs: [slab('s1', 1, 9, '100.00'), slab('s2', 10, null, '80.00')],
    });
    const dto = baseDto([{ productId: 'prod-1', productName: 'Steel Coil', quantity: 10, unitPrice: 100 }]);
    await service.create('buyer-1', 'u1', dto as any);
    expect(Number(persisted.items.create[0].unitPrice)).toBe(80);
    expect(Number(persisted.subtotal)).toBe(800);
  });

  it('7. quantity below the valid slab range is rejected', async () => {
    products['prod-1'] = catalogProduct({
      priceSlabs: [slab('s1', 10, 49, '100.00')],
    });
    const dto = baseDto([{ productId: 'prod-1', productName: 'Steel Coil', quantity: 5, unitPrice: 100 }]);
    await expect(service.create('buyer-1', 'u1', dto as any)).rejects.toThrow(BadRequestException);
    expect(prisma.order.create).not.toHaveBeenCalled();
  });

  it.each([0, -1, 2.5])('8. invalid quantity %s is rejected', async (qty) => {
    const dto = baseDto([{ productId: 'prod-1', productName: 'Steel Coil', quantity: qty, unitPrice: 100 }]);
    await expect(service.create('buyer-1', 'u1', dto as any)).rejects.toThrow(BadRequestException);
    expect(prisma.order.create).not.toHaveBeenCalled();
  });

  it('9. MOQ violation is rejected where an authoritative MOQ exists', async () => {
    products['prod-1'] = catalogProduct({ moq: 10, priceSlabs: [slab('s1', 1, null, '100.00')] });
    const dto = baseDto([{ productId: 'prod-1', productName: 'Steel Coil', quantity: 5, unitPrice: 100 }]);
    await expect(service.create('buyer-1', 'u1', dto as any)).rejects.toThrow(BadRequestException);
    expect(prisma.order.create).not.toHaveBeenCalled();
  });

  it('10. maxOrderQty violation is rejected where an authoritative field exists', async () => {
    products['prod-1'] = catalogProduct({ maxOrderQty: 100, priceSlabs: [slab('s1', 1, null, '100.00')] });
    const dto = baseDto([{ productId: 'prod-1', productName: 'Steel Coil', quantity: 101, unitPrice: 100 }]);
    await expect(service.create('buyer-1', 'u1', dto as any)).rejects.toThrow(BadRequestException);
    expect(prisma.order.create).not.toHaveBeenCalled();
  });

  it('11. records the existing informational reservation without claiming stock enforcement', async () => {
    // Stock enforcement is a documented STOP sub-scope (no inventory
    // reservation mechanism exists anywhere in the order lifecycle).
    // This test pins the preserved behavior: the order line still
    // records reservedQuantity = quantity, released to 0 on cancel.
    const dto = baseDto([{ productId: 'prod-1', productName: 'Steel Coil', quantity: 4, unitPrice: 100 }]);
    await service.create('buyer-1', 'u1', dto as any);
    expect(persisted.items.create[0].reservedQuantity).toBe(4);
  });

  it('12. valid order persists monetary fields exactly equal to the server calculation', async () => {
    const dto = baseDto([{ productId: 'prod-1', productName: 'Steel Coil', quantity: 3, unitPrice: 100 }]);
    await service.create('buyer-1', 'u1', dto as any);
    expect(persisted.items.create[0].unitPrice.toFixed(2)).toBe('100.00');
    expect(persisted.items.create[0].totalPrice.toFixed(2)).toBe('300.00');
    expect(persisted.subtotal.toFixed(2)).toBe('300.00');
    expect(persisted.totalAmount.toFixed(2)).toBe('300.00');
    expect(persisted.taxAmount).toBeNull();
    expect(persisted.discountAmount).toBeNull();
    expect(persisted.quantity).toBe(3);
  });

  it('13. multiple items are each resolved independently and summed server-side', async () => {
    products['prod-1'] = catalogProduct({ priceSlabs: [slab('s1', 1, null, '100.00')] });
    products['prod-2'] = catalogProduct({
      id: 'prod-2', slug: 'prod-2', name: 'Copper Wire', companyId: 'seller-1',
      priceSlabs: [slab('s1', 1, null, '50.00')],
    });
    const dto = baseDto([
      { productId: 'prod-1', productName: 'Steel Coil', quantity: 2, unitPrice: 1 },
      { productId: 'prod-2', productName: 'Wrong Name', quantity: 3, unitPrice: 1 },
    ]);
    await service.create('buyer-1', 'u1', dto as any);
    expect(Number(persisted.items.create[0].totalPrice)).toBe(200);
    expect(Number(persisted.items.create[1].totalPrice)).toBe(150);
    expect(Number(persisted.subtotal)).toBe(350);
    expect(Number(persisted.totalAmount)).toBe(350);
    // Server identity wins for catalog items.
    expect(persisted.items.create[1].productName).toBe('Copper Wire');
  });

  it('14. omitted client money fields still produce a valid server-priced order', async () => {
    const dto = baseDto([{ productId: 'prod-1', productName: 'Steel Coil', quantity: 2 }]);
    await service.create('buyer-1', 'u1', dto as any);
    expect(Number(persisted.subtotal)).toBe(200);
    expect(Number(persisted.totalAmount)).toBe(200);
  });

  it('15. malicious/extreme numeric input is rejected safely with no corrupt financial state', async () => {
    for (const unitPrice of [Number.NaN, Number.POSITIVE_INFINITY, -5]) {
      const dto = baseDto([{ productName: 'Custom Work', quantity: 1, unitPrice }]);
      await expect(service.create('buyer-1', 'u1', dto as any)).rejects.toThrow(BadRequestException);
    }
    expect(prisma.order.create).not.toHaveBeenCalled();
  });

  it('computes exact Decimal money with no floating-point drift (slab 19.99 x 3)', async () => {
    products['prod-1'] = catalogProduct({ priceSlabs: [slab('s1', 1, null, '19.99')] });
    const dto = baseDto([{ productId: 'prod-1', productName: 'Steel Coil', quantity: 3, unitPrice: 19.99 }]);
    await service.create('buyer-1', 'u1', dto as any);
    expect(persisted.items.create[0].totalPrice.toFixed(2)).toBe('59.97');
    expect(persisted.subtotal.toFixed(2)).toBe('59.97');
  });

  it('custom non-catalog items use Decimal math on client values (0.1 x 3 = 0.30 exact)', async () => {
    const dto = baseDto([{ productName: 'Custom Work', quantity: 3, unitPrice: 0.1 }]);
    await service.create('buyer-1', 'u1', dto as any);
    expect(persisted.items.create[0].productId).toBeNull();
    expect(persisted.items.create[0].totalPrice.toFixed(2)).toBe('0.30');
  });

  it('rejects a catalog item that does not belong to the order seller', async () => {
    products['prod-1'] = catalogProduct({ companyId: 'other-seller' });
    const dto = baseDto([{ productId: 'prod-1', productName: 'Steel Coil', quantity: 1, unitPrice: 100 }]);
    await expect(service.create('buyer-1', 'u1', dto as any)).rejects.toThrow(BadRequestException);
    expect(prisma.order.create).not.toHaveBeenCalled();
  });

  it('rejects an unknown product', async () => {
    const dto = baseDto([{ productId: 'missing', productName: 'Ghost', quantity: 1, unitPrice: 100 }]);
    await expect(service.create('buyer-1', 'u1', dto as any)).rejects.toThrow(NotFoundException);
    expect(prisma.order.create).not.toHaveBeenCalled();
  });

  it('rejects an order with no items', async () => {
    const dto = baseDto([]);
    await expect(service.create('buyer-1', 'u1', dto as any)).rejects.toThrow(BadRequestException);
    expect(prisma.order.create).not.toHaveBeenCalled();
  });

  it('uses the resolved slab currency for the order', async () => {
    products['prod-1'] = catalogProduct({ priceSlabs: [slab('s1', 1, null, '10.00', 'USD')] });
    const dto = baseDto([{ productId: 'prod-1', productName: 'Steel Coil', quantity: 2, unitPrice: 10 }]);
    await service.create('buyer-1', 'u1', dto as any);
    expect(persisted.currency).toBe('USD');
  });
});
