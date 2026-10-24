import { Test, TestingModule } from '@nestjs/testing';
import { Prisma } from '@prisma/client';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PaymentService } from './payment.service';
import { PrismaService } from '../../prisma/prisma.service';
import { RazorpayService } from './gateways/razorpay.service';
import { StripeService } from './gateways/stripe.service';
import { MembershipService } from '../membership/membership.service';
import { EscrowService } from '../escrow/escrow.service';
import { InvoiceService } from '../billing/invoice.service';
import { NotificationService } from '../notification/notification.service';

const D = (v: string) => new Prisma.Decimal(v);

/**
 * R3 — authoritative order payment amount.
 * Proves the gateway charge and the stored Payment amount come exclusively
 * from the persisted Order.totalAmount, never from client input.
 */
describe('PaymentService authoritative order amount (R3 security)', () => {
  let service: PaymentService;
  let prisma: Record<string, any>;
  let razorpay: { createOrder: jest.Mock };
  let persisted: any;

  const order = (overrides: Record<string, any> = {}) => ({
    id: 'order-1',
    buyerCompanyId: 'company-1',
    totalAmount: D('10000.00'),
    currency: 'INR',
    deletedAt: null,
    ...overrides,
  });

  beforeEach(async () => {
    persisted = undefined;
    razorpay = {
      createOrder: jest.fn((amount: number) =>
        Promise.resolve({ id: 'order_rzptest', gatewayOrderId: 'order_rzptest', amount, currency: 'INR' }),
      ),
    };
    prisma = {
      company: { findFirst: jest.fn().mockResolvedValue({ id: 'company-1' }) },
      order: { findUnique: jest.fn().mockResolvedValue(order()) },
      payment: {
        create: jest.fn((args: any) => {
          persisted = args.data;
          return Promise.resolve({ id: 'payment-1' });
        }),
        findFirst: jest.fn().mockResolvedValue(null),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PaymentService,
        { provide: PrismaService, useValue: prisma },
        { provide: RazorpayService, useValue: { ...razorpay, verifyPayment: jest.fn(), createRefund: jest.fn(), getKeyId: jest.fn().mockReturnValue('rzp_test_key') } },
        { provide: StripeService, useValue: { createOrder: jest.fn(), verifyPayment: jest.fn() } },
        { provide: MembershipService, useValue: { activateSubscription: jest.fn() } },
        { provide: EscrowService, useValue: { hold: jest.fn() } },
        { provide: InvoiceService, useValue: { generateInvoiceNumber: jest.fn() } },
        { provide: NotificationService, useValue: { createWithTemplate: jest.fn().mockResolvedValue(undefined) } },
        { provide: EventEmitter2, useValue: { emit: jest.fn() } },
      ],
    }).compile();

    service = module.get(PaymentService);
  });

  const orderPayment = (dto: Record<string, any>) =>
    service.createPaymentOrder('company-1', { type: 'ORDER_PAYMENT', orderId: 'order-1', ...dto } as any);

  it('1. client sends Rs.1 for a Rs.10,000 order -> gateway receives 1000000 paise', async () => {
    await orderPayment({ amount: 100 });
    expect(razorpay.createOrder).toHaveBeenCalledWith(
      1000000, 'INR', expect.any(String), { companyId: 'company-1', type: 'ORDER_PAYMENT' },
    );
    expect(persisted.amount).toBe(1000000);
  });

  it('2. inflated client amount is ignored', async () => {
    await orderPayment({ amount: 99999999 });
    expect(razorpay.createOrder).toHaveBeenCalledWith(
      1000000, 'INR', expect.any(String), expect.anything(),
    );
    expect(persisted.amount).toBe(1000000);
  });

  it('3. manipulated totalAmount-style value is ignored', async () => {
    // Client replays a different (stale/forged) order total as paise.
    await orderPayment({ amount: 540000 });
    expect(razorpay.createOrder).toHaveBeenCalledWith(1000000, 'INR', expect.any(String), expect.anything());
  });

  it('4. client amount derived from manipulated slab math is ignored', async () => {
    // Fake unit price 100 x qty 60 = 600000 paise; the order says 10000.00.
    await orderPayment({ amount: 600000 });
    expect(razorpay.createOrder).toHaveBeenCalledWith(1000000, 'INR', expect.any(String), expect.anything());
    expect(persisted.amount).toBe(1000000);
  });

  it('5. omitted client amount still charges the persisted order total', async () => {
    await service.createPaymentOrder('company-1', { type: 'ORDER_PAYMENT', orderId: 'order-1' } as any);
    expect(razorpay.createOrder).toHaveBeenCalledWith(1000000, 'INR', expect.any(String), expect.anything());
  });

  it('6. stale client amount loses to a re-priced persisted total', async () => {
    prisma.order.findUnique.mockResolvedValue(order({ totalAmount: D('450.00') }));
    await orderPayment({ amount: 50000 });
    expect(razorpay.createOrder).toHaveBeenCalledWith(45000, 'INR', expect.any(String), expect.anything());
    expect(persisted.amount).toBe(45000);
  });

  it('7. cross-company order payment is rejected without revealing existence', async () => {
    prisma.order.findUnique.mockResolvedValue(order({ buyerCompanyId: 'other-co' }));
    await expect(orderPayment({ amount: 1000000 })).rejects.toThrow(NotFoundException);
    expect(razorpay.createOrder).not.toHaveBeenCalled();
    expect(prisma.payment.create).not.toHaveBeenCalled();
  });

  it('8. nonexistent order is rejected with no gateway call', async () => {
    prisma.order.findUnique.mockResolvedValue(null);
    await expect(orderPayment({ amount: 1000000 })).rejects.toThrow(NotFoundException);
    expect(razorpay.createOrder).not.toHaveBeenCalled();
    expect(prisma.payment.create).not.toHaveBeenCalled();
  });

  it.each([
    ['null total', null],
    ['negative total', D('-5.00')],
    ['zero total', D('0.00')],
    ['NaN total', new Prisma.Decimal(Number.NaN)],
  ])('9. invalid persisted amount (%s) is rejected with no gateway call', async (_label, totalAmount) => {
    prisma.order.findUnique.mockResolvedValue(order({ totalAmount }));
    await expect(orderPayment({ amount: 1000000 })).rejects.toThrow(BadRequestException);
    expect(razorpay.createOrder).not.toHaveBeenCalled();
    expect(prisma.payment.create).not.toHaveBeenCalled();
  });

  it.each([
    ['19.99', 1999],
    ['0.01', 1],
    ['59.97', 5997],
    ['100.00', 10000],
  ])('10. exact decimal conversion %s -> %s paise', async (rupees, paise) => {
    prisma.order.findUnique.mockResolvedValue(order({ totalAmount: D(rupees) }));
    await orderPayment({ amount: 1 });
    expect(razorpay.createOrder).toHaveBeenCalledWith(paise, 'INR', expect.any(String), expect.anything());
    expect(persisted.amount).toBe(paise);
  });

  it.each([['10.005'], ['10.001']])('11. fractional paise %s is rejected, never rounded', async (rupees) => {
    prisma.order.findUnique.mockResolvedValue(order({ totalAmount: D(rupees) }));
    await expect(orderPayment({ amount: 1000 })).rejects.toThrow(BadRequestException);
    expect(razorpay.createOrder).not.toHaveBeenCalled();
    expect(prisma.payment.create).not.toHaveBeenCalled();
  });

  it('12. gateway failure creates no payment record and no false success state', async () => {
    razorpay.createOrder.mockRejectedValue(new Error('gateway down'));
    await expect(orderPayment({ amount: 100 })).rejects.toThrow('gateway down');
    expect(prisma.payment.create).not.toHaveBeenCalled();
  });

  it('existing PENDING payment is returned without creating a duplicate gateway order', async () => {
    prisma.payment.findFirst.mockResolvedValue({
      id: 'pay-old', gatewayOrderId: 'order_old', amount: 1000000, currency: 'INR',
    });
    const result = await orderPayment({ amount: 100 });
    expect(result.id).toBe('pay-old');
    expect(razorpay.createOrder).not.toHaveBeenCalled();
    expect(prisma.payment.create).not.toHaveBeenCalled();
  });

  it('stored payment amount exactly equals the gateway amount', async () => {
    prisma.order.findUnique.mockResolvedValue(order({ totalAmount: D('59.97') }));
    await orderPayment({ amount: 1 });
    const gatewayAmount = razorpay.createOrder.mock.calls[0][0];
    expect(gatewayAmount).toBe(5997);
    expect(persisted.amount).toBe(gatewayAmount);
    expect(persisted.orderId).toBe('order-1');
    expect(persisted.currency).toBe('INR');
  });
});
