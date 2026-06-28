import { Test, TestingModule } from '@nestjs/testing';
import { PaymentService } from './payment.service';
import { RazorpayService } from './gateways/razorpay.service';
import { PrismaService } from '../../prisma/prisma.service';
import { BadRequestException, NotFoundException } from '@nestjs/common';

const mockPrisma = {
  company: {
    findFirst: jest.fn(),
  },
  order: {
    findUnique: jest.fn(),
  },
  rfqCreditPack: {
    findUnique: jest.fn(),
  },
  payment: {
    create: jest.fn(),
    findFirst: jest.fn(),
    findMany: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
    updateMany: jest.fn(),
    count: jest.fn(),
  },
  refund: {
    create: jest.fn(),
    aggregate: jest.fn(),
    updateMany: jest.fn(),
  },
  rfqCreditLedger: {
    create: jest.fn(),
  },
  invoice: {
    create: jest.fn(),
    count: jest.fn(),
  },
};

const mockRazorpayService = {
  createOrder: jest.fn(),
  verifyPayment: jest.fn(),
  createRefund: jest.fn(),
  getKeyId: jest.fn().mockReturnValue('rzp_test_key'),
};

describe('PaymentService', () => {
  let service: PaymentService;
  let razorpay: RazorpayService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PaymentService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: RazorpayService, useValue: mockRazorpayService },
      ],
    }).compile();

    service = module.get<PaymentService>(PaymentService);
    razorpay = module.get<RazorpayService>(RazorpayService);
    jest.clearAllMocks();
  });

  describe('createPaymentOrder', () => {
    it('should throw NotFoundException if company not found', async () => {
      mockPrisma.company.findFirst.mockResolvedValue(null);
      await expect(
        service.createPaymentOrder('company-1', { type: 'ORDER_PAYMENT' as any, amount: 10000 }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if orderId missing for ORDER_PAYMENT', async () => {
      mockPrisma.company.findFirst.mockResolvedValue({ id: 'company-1' });
      await expect(
        service.createPaymentOrder('company-1', { type: 'ORDER_PAYMENT' as any, amount: 10000 }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should create a Razorpay order and Payment record', async () => {
      mockPrisma.company.findFirst.mockResolvedValue({ id: 'company-1' });
      mockPrisma.order.findUnique.mockResolvedValue({ id: 'order-1' });
      mockRazorpayService.createOrder.mockResolvedValue({
        id: 'order_OeP9K7ZcNxLm1',
        amount: 50000,
        currency: 'INR',
      });
      mockPrisma.payment.create.mockResolvedValue({ id: 'payment-1' });

      const result = await service.createPaymentOrder('company-1', {
        type: 'ORDER_PAYMENT' as any,
        amount: 50000,
        orderId: 'order-1',
      });

      expect(mockRazorpayService.createOrder).toHaveBeenCalledWith(50000, 'INR', expect.any(String), {
        companyId: 'company-1',
        type: 'ORDER_PAYMENT',
      });
      expect(mockPrisma.payment.create).toHaveBeenCalled();
      expect(result.id).toBe('payment-1');
      expect(result.gatewayOrderId).toBe('order_OeP9K7ZcNxLm1');
    });
  });

  describe('verifyPayment', () => {
    it('should throw NotFoundException if payment not found', async () => {
      mockPrisma.payment.findFirst.mockResolvedValue(null);
      await expect(
        service.verifyPayment('company-1', {
          razorpayOrderId: 'order_OeP9K7ZcNxLm1',
          razorpayPaymentId: 'pay_OeP9K7ZcNxLm2',
          razorpaySignature: 'sig',
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if signature invalid', async () => {
      mockPrisma.payment.findFirst.mockResolvedValue({ id: 'payment-1', status: 'PENDING' });
      mockRazorpayService.verifyPayment.mockReturnValue(false);
      await expect(
        service.verifyPayment('company-1', {
          razorpayOrderId: 'order_OeP9K7ZcNxLm1',
          razorpayPaymentId: 'pay_OeP9K7ZcNxLm2',
          razorpaySignature: 'bad-sig',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should update payment to CAPTURED on valid signature', async () => {
      mockPrisma.payment.findFirst.mockResolvedValue({
        id: 'payment-1',
        companyId: 'company-1',
        gatewayOrderId: 'order_OeP9K7ZcNxLm1',
        status: 'PENDING',
      });
      mockRazorpayService.verifyPayment.mockReturnValue(true);
      mockPrisma.payment.update.mockResolvedValue({
        id: 'payment-1',
        status: 'CAPTURED',
        gatewayPaymentId: 'pay_OeP9K7ZcNxLm2',
      });
      mockPrisma.invoice.count.mockResolvedValue(0);
      mockPrisma.invoice.create.mockResolvedValue({});

      const result = await service.verifyPayment('company-1', {
        razorpayOrderId: 'order_OeP9K7ZcNxLm1',
        razorpayPaymentId: 'pay_OeP9K7ZcNxLm2',
        razorpaySignature: 'valid-sig',
      });

      expect(mockRazorpayService.verifyPayment).toHaveBeenCalled();
      expect(mockPrisma.payment.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'payment-1' },
          data: expect.objectContaining({ status: 'CAPTURED' }),
        }),
      );
      expect(result.status).toBe('CAPTURED');
    });
  });

  describe('findAll', () => {
    it('should return paginated payments', async () => {
      mockPrisma.payment.findMany.mockResolvedValue([{ id: 'payment-1', refunds: [], order: null }]);
      mockPrisma.payment.count.mockResolvedValue(1);
      const result = await service.findAll('company-1');
      expect(result.data).toHaveLength(1);
      expect(result.meta.total).toBe(1);
    });
  });

  describe('findOne', () => {
    it('should throw NotFoundException if payment not found', async () => {
      mockPrisma.payment.findFirst.mockResolvedValue(null);
      await expect(service.findOne('company-1', 'payment-1')).rejects.toThrow(NotFoundException);
    });

    it('should return payment with refunds', async () => {
      mockPrisma.payment.findFirst.mockResolvedValue({
        id: 'payment-1',
        refunds: [],
        order: null,
        rfqCreditPack: null,
      });
      const result = await service.findOne('company-1', 'payment-1');
      expect(result.id).toBe('payment-1');
    });
  });

  describe('createRefund', () => {
    it('should throw NotFoundException if payment not found', async () => {
      mockPrisma.payment.findFirst.mockResolvedValue(null);
      await expect(
        service.createRefund('company-1', 'payment-1', { amount: 1000 }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if payment not captured', async () => {
      mockPrisma.payment.findFirst.mockResolvedValue({ id: 'payment-1', status: 'PENDING', amount: 5000, companyId: 'company-1' });
      await expect(
        service.createRefund('company-1', 'payment-1', { amount: 1000 }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should create refund and update payment status', async () => {
      mockPrisma.payment.findFirst.mockResolvedValue({
        id: 'payment-1',
        status: 'CAPTURED',
        amount: 5000,
        companyId: 'company-1',
        gatewayPaymentId: 'pay_OeP9K7ZcNxLm2',
      });
      mockPrisma.refund.aggregate.mockResolvedValue({ _sum: { amount: 0 } });
      mockRazorpayService.createRefund.mockResolvedValue({ id: 'rfnd_OeP9K7ZcNxLm3' });
      mockPrisma.refund.create.mockResolvedValue({ id: 'refund-1', status: 'PROCESSING' });
      mockPrisma.payment.update.mockResolvedValue({});

      const result = await service.createRefund('company-1', 'payment-1', {
        amount: 5000,
        reason: 'Customer returned item',
      });

      expect(mockRazorpayService.createRefund).toHaveBeenCalled();
      expect(mockPrisma.refund.create).toHaveBeenCalled();
      expect(mockPrisma.payment.update).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: 'payment-1' }, data: { status: 'REFUNDED' } }),
      );
      expect(result.status).toBe('PROCESSING');
    });
  });

  describe('handleWebhookEvent', () => {
    it('should capture payment on payment.captured event', async () => {
      mockPrisma.payment.findFirst
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce({ id: 'payment-1', status: 'PENDING', companyId: 'company-1', amount: 5000 });
      mockPrisma.payment.update.mockResolvedValue({});
      mockPrisma.invoice.count.mockResolvedValue(0);
      mockPrisma.invoice.create.mockResolvedValue({});

      await service.handleWebhookEvent('payment.captured', {
        payment: { entity: { id: 'pay_123', order_id: 'order_123' } },
      });

      expect(mockPrisma.payment.update).toHaveBeenCalled();
    });
  });
});
