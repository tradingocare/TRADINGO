import { Test, TestingModule } from '@nestjs/testing';
import { GoCashService } from './go-cash.service';
import { PrismaService } from '../../prisma/prisma.service';

describe('GoCashService', () => {
  let service: GoCashService;
  let prisma: any;

  beforeEach(async () => {
    prisma = {
      company: { findFirst: jest.fn(), update: jest.fn() },
      goCashTransaction: { create: jest.fn(), findMany: jest.fn(), count: jest.fn() },
      $transaction: jest.fn((cb: any) => cb(prisma)),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GoCashService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<GoCashService>(GoCashService);
  });

  describe('getBalance', () => {
    it('should return balance and INR value', async () => {
      prisma.company.findFirst.mockResolvedValue({ id: 'c1', goCashBalance: 1000 });
      const balance = await service.getBalance('c1');
      expect(balance.balance).toBe(1000);
      expect(balance.inrValue).toBe(100);
    });
  });

  describe('addTransaction', () => {
    it('should add earned transaction', async () => {
      prisma.company.findFirst.mockResolvedValue({ id: 'c1', goCashBalance: 100 });
      prisma.goCashTransaction.create.mockResolvedValue({ id: 'tx1', type: 'EARNED', amount: 500 } as any);
      prisma.company.update.mockResolvedValue({} as any);
      const tx = await service.addTransaction('c1', 'user-1', { type: 'EARNED', amount: 500, reason: 'Test', sourceModule: 'TEST' });
      expect(tx.id).toBe('tx1');
      expect(prisma.company.update).toHaveBeenCalledWith(expect.objectContaining({ data: { goCashBalance: 600 } }));
    });

    it('should throw for insufficient balance on redemption', async () => {
      prisma.company.findFirst.mockResolvedValue({ id: 'c1', goCashBalance: 50 });
      await expect(service.addTransaction('c1', 'user-1', { type: 'REDEEMED', amount: 100 })).rejects.toThrow('Insufficient');
    });
  });

  describe('redeem', () => {
    it('should redeem GOCASH', async () => {
      prisma.company.findFirst.mockResolvedValue({ id: 'c1', goCashBalance: 500 });
      prisma.goCashTransaction.create.mockResolvedValue({ id: 'tx1', type: 'REDEEMED', amount: 200 } as any);
      prisma.company.update.mockResolvedValue({} as any);
      const tx = await service.redeem('c1', 'user-1', 200, 'PLANS', 'order-1');
      expect(tx.amount).toBe(200);
    });
  });

  describe('getConversionRate', () => {
    it('should return conversion rate', async () => {
      const rate = await service.getConversionRate();
      expect(rate.gcToInr).toBe(10);
    });
  });

  describe('canRedeem', () => {
    it('should calculate max redeemable', () => {
      const result = service.canRedeem(500, 1000);
      expect(result.allowed).toBe(true);
      expect(result.maxRedeemable).toBe(500);
    });

    it('should limit by 50% of transaction value', () => {
      const result = service.canRedeem(1000, 100);
      expect(result.maxRedeemable).toBe(50);
    });
  });
});
