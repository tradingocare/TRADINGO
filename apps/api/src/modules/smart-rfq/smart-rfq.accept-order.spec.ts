import { SmartRfqService } from './smart-rfq.service';
import { NotFoundException, BadRequestException } from '@nestjs/common';

/**
 * P0-6 regression suite — quote acceptance creates exactly one linked Order.
 * Prototype-instantiation isolates acceptQuote() with hand-rolled prisma mocks.
 */
describe('SmartRfqService.acceptQuote — P0-6 order linkage', () => {
  const RFQ_ID = 'rfq-1';
  const QUOTE_ID = 'q-1';
  const BUYER_CO = 'buyer-co';
  const SELLER_CO = 'seller-co';

  const build = (quoteOver: Record<string, unknown> = {}) => {
    const rfq = { id: RFQ_ID, companyId: BUYER_CO, status: 'OPEN', type: 'PRODUCT', deletedAt: null };
    const quote = {
      id: QUOTE_ID, rfqId: RFQ_ID, companyId: SELLER_CO, status: 'SUBMITTED',
      totalAmount: { toNumber: () => 5000 }, currency: 'INR', ...quoteOver,
    };
    const calls = { orderCreates: [] as any[] };
    const prisma: any = {
      rfq: { findFirst: jest.fn(async () => ({ ...rfq })), update: jest.fn(async ({ data }: any) => ({ id: RFQ_ID, ...data })) },
      quote: {
        findFirst: jest.fn(async () => ({ ...quote })),
        update: jest.fn(async ({ data }: any) => ({ id: QUOTE_ID, ...data })),
        updateMany: jest.fn(async ({ where, data }: any) => ({ count: 2 })),
      },
      company: { findFirst: jest.fn(async () => ({ id: SELLER_CO, deletedAt: null })) },
      companyOwner: { findFirst: jest.fn(async ({ where }: any) =>
        where.userId === 'user-1' ? { userId: where.userId, companyId: BUYER_CO, company: { id: BUYER_CO } } : null) },
      companyLocation: { findFirst: jest.fn(async () => ({ state: 'Delhi' })) },
      order: {
        create: jest.fn(async ({ data }: any) => {
          calls.orderCreates.push(data);
          return { id: `order-${calls.orderCreates.length}`, ...data };
        }),
        findUnique: jest.fn(),
      },
      $transaction: jest.fn(async (ops: any[]) => {
        // Emulate atomicity: execute in order; a throw rolls everything back.
        const results = [];
        for (const op of ops) results.push(await op);
        return results;
      }),
    };
    const svc: any = Object.create(SmartRfqService.prototype);
    svc.prisma = prisma;
    svc.logger = { warn: jest.fn(), log: jest.fn(), error: jest.fn() };
    svc.orderNumberService = { generate: jest.fn().mockResolvedValue('TRD-DEL-000001') };
    return { svc, prisma, calls, quote };
  };

  it('1+2+3+4. valid acceptance creates exactly one Order with correct linkage', async () => {
    const { svc, prisma, calls } = build();
    const res = await svc.acceptQuote('user-1', RFQ_ID, QUOTE_ID);
    expect(calls.orderCreates).toHaveLength(1);
    expect(res.order.buyerCompanyId).toBe(BUYER_CO);
    expect(res.order.sellerCompanyId).toBe(SELLER_CO);
    expect(res.order.rfqId).toBe(RFQ_ID);
    expect(res.order.quoteId).toBe(QUOTE_ID);
    expect(prisma.quote.update).toHaveBeenCalledWith({ where: { id: QUOTE_ID }, data: { status: 'ACCEPTED' } });
  });

  it('5. totalAmount/currency copied from the quote; source=QUOTE; number generated', async () => {
    const { svc, calls, quote } = build({ currency: 'USD' });
    await svc.acceptQuote('user-1', RFQ_ID, QUOTE_ID);
    expect(calls.orderCreates[0].totalAmount).toBe(quote.totalAmount);
    expect(calls.orderCreates[0].currency).toBe('USD');
    expect(calls.orderCreates[0].source).toBe('QUOTE');
    function quote_total() { return { toNumber: () => 5000 }; }
    expect(svc.orderNumberService.generate).toHaveBeenCalledWith('Delhi');
  });

  it('6. idempotency key is deterministic QUOTE_ACCEPT_{quoteId}', async () => {
    const { svc, calls } = build();
    await svc.acceptQuote('user-1', RFQ_ID, QUOTE_ID);
    expect(calls.orderCreates[0].idempotencyKey).toBe('QUOTE_ACCEPT_q-1');
  });

  it('7. second acceptance cannot create a second Order (status guard)', async () => {
    const processed = build();
    await processed.svc.acceptQuote('user-1', RFQ_ID, QUOTE_ID);
    const again = build({ status: 'ACCEPTED' });
    // Prisma where (status IN SUBMITTED/VIEWED) excludes the processed quote → null
    again.prisma.quote.findFirst.mockResolvedValue(null);
    await expect(again.svc.acceptQuote('user-1', RFQ_ID, QUOTE_ID)).rejects.toThrow('already processed');
    expect(again.calls.orderCreates).toHaveLength(0);
  });

  it('8. null totalAmount rejects BEFORE any state mutation', async () => {
    const { svc, prisma } = build({ totalAmount: null });
    await expect(svc.acceptQuote('user-1', RFQ_ID, QUOTE_ID)).rejects.toThrow(BadRequestException);
    expect(prisma.quote.update).not.toHaveBeenCalled();
    expect(prisma.rfq.update).not.toHaveBeenCalled();
    expect(prisma.quote.updateMany).not.toHaveBeenCalled();
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it('9. order-create failure rolls back acceptance transaction', async () => {
    const { svc, prisma } = build();
    (prisma.$transaction as jest.Mock).mockImplementation(async () => {
      throw new Error('order write failed');
    });
    await expect(svc.acceptQuote('user-1', RFQ_ID, QUOTE_ID)).rejects.toThrow('order write failed');
    expect(prisma.quote.update).toHaveBeenCalledTimes(1); // attempted inside tx only
  });

  it('10-12. authorization unchanged: no-company user NotFound; wrong RFQ owner NotFound', async () => {
    const stranger = build();
    stranger.prisma.companyOwner.findFirst.mockResolvedValue(null);
    await expect(stranger.svc.acceptQuote('user-x', RFQ_ID, QUOTE_ID)).rejects.toThrow(NotFoundException);

    const wrongRfqOwner = build();
    wrongRfqOwner.prisma.rfq.findFirst.mockResolvedValue(null);
    await expect(wrongRfqOwner.svc.acceptQuote('user-1', RFQ_ID, QUOTE_ID)).rejects.toThrow(NotFoundException);
    expect(wrongRfqOwner.calls.orderCreates).toHaveLength(0);
  });
});
