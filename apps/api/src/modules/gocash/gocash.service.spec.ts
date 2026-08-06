import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, NotFoundException, BadRequestException } from '@nestjs/common';
import { GocashService } from './gocash.service';
import { PrismaService } from '../../prisma/prisma.service';
import { createMockPrisma, mockWallet, mockTransaction, mockRedemption } from '../../common/test/test-utils';

describe('GocashService', () => {
  let service: GocashService;
  let prisma: ReturnType<typeof createMockPrisma>;

  beforeEach(async () => {
    prisma = createMockPrisma();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GocashService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();
    service = module.get<GocashService>(GocashService);
    jest.clearAllMocks();
  });

  describe('createWallet', () => {
    it('should create a wallet successfully', async () => {
      prisma.gOCASH_Wallet.findUnique.mockResolvedValue(null);
      prisma.gOCASH_Wallet.create.mockResolvedValue(mockWallet);

      const result = await service.createWallet('user-1', 'company-1', 'BUYER', true);

      expect(result).toEqual(mockWallet);
      expect(prisma.gOCASH_Wallet.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId: 'user-1',
          companyId: 'company-1',
          type: 'BUYER',
          currentBalance: 0,
          availableBalance: 0,
          kycVerified: true,
          status: 'ACTIVE',
        }),
      });
    });

    it('should throw ConflictException if wallet already exists', async () => {
      prisma.gOCASH_Wallet.findUnique.mockResolvedValue(mockWallet);

      await expect(service.createWallet('user-1', 'company-1', 'BUYER'))
        .rejects.toThrow(ConflictException);
    });
  });

  describe('credit', () => {
    const creditParams = {
      walletId: 'wallet-1',
      amount: 500,
      type: 'CAMPAIGN_REWARD' as const,
      reason: 'Campaign reward',
      actorId: 'user-1',
      actorType: 'USER',
    };

    it('should credit wallet successfully', async () => {
      const tx = { gOCASH_Wallet: { findUnique: jest.fn().mockResolvedValue(mockWallet), update: jest.fn() }, gOCASH_Transaction: { create: jest.fn().mockResolvedValue(mockTransaction) } };
      prisma.$transaction.mockImplementation((fn: any) => fn(tx));

      const result = await service.credit(creditParams);

      expect(result.walletId).toBe('wallet-1');
      expect(result.direction).toBe('CREDIT');
      expect(tx.gOCASH_Wallet.update).toHaveBeenCalled();
    });

    it('should throw BadRequestException for non-positive amount', async () => {
      await expect(service.credit({ ...creditParams, amount: 0 }))
        .rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException if wallet not found', async () => {
      const tx = { gOCASH_Wallet: { findUnique: jest.fn().mockResolvedValue(null) }, gOCASH_Transaction: { create: jest.fn() } };
      prisma.$transaction.mockImplementation((fn: any) => fn(tx));

      await expect(service.credit(creditParams)).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if wallet is suspended', async () => {
      const tx = { gOCASH_Wallet: { findUnique: jest.fn().mockResolvedValue({ ...mockWallet, status: 'SUSPENDED' }) }, gOCASH_Transaction: { create: jest.fn() } };
      prisma.$transaction.mockImplementation((fn: any) => fn(tx));

      await expect(service.credit(creditParams)).rejects.toThrow(BadRequestException);
    });

    it('should handle idempotency', async () => {
      prisma.gOCASH_Transaction.findUnique.mockResolvedValue(mockTransaction);

      const result = await service.credit({ ...creditParams, idempotencyKey: 'idem-1' });

      expect(result.id).toBe('tx-1');
      expect(prisma.$transaction).not.toHaveBeenCalled();
    });
  });

  describe('debit', () => {
    const debitParams = {
      walletId: 'wallet-1',
      amount: 300,
      type: 'REDEMPTION' as const,
      reason: 'Purchase redemption',
      actorId: 'user-1',
      actorType: 'USER',
    };

    it('should debit wallet successfully', async () => {
      const tx = { gOCASH_Wallet: { findUnique: jest.fn().mockResolvedValue(mockWallet), update: jest.fn() }, gOCASH_Transaction: { create: jest.fn().mockResolvedValue(mockTransaction) } };
      prisma.$transaction.mockImplementation((fn: any) => fn(tx));

      const result = await service.debit(debitParams);

      expect(result.walletId).toBe('wallet-1');
      expect(result.direction).toBe('CREDIT');
    });

    it('should throw BadRequestException for insufficient balance', async () => {
      const lowBalanceWallet = { ...mockWallet, availableBalance: 100 };
      const tx = { gOCASH_Wallet: { findUnique: jest.fn().mockResolvedValue(lowBalanceWallet) }, gOCASH_Transaction: { create: jest.fn() } };
      prisma.$transaction.mockImplementation((fn: any) => fn(tx));

      await expect(service.debit(debitParams)).rejects.toThrow(BadRequestException);
    });
  });

  describe('reverse', () => {
    it('should reverse a credit transaction (create debit reversal)', async () => {
      const creditTx = { ...mockTransaction, direction: 'CREDIT', amount: 500, status: 'SUCCESS' };
      const tx = { gOCASH_Wallet: { findUnique: jest.fn().mockResolvedValue(mockWallet), update: jest.fn() }, gOCASH_Transaction: { findUnique: jest.fn().mockResolvedValue(creditTx), create: jest.fn().mockResolvedValue({ ...mockTransaction, id: 'tx-reversal' }) } };
      prisma.$transaction.mockImplementation((fn: any) => fn(tx));

      const result = await service.reverse('tx-1', 'Customer requested reversal', 'admin-1');

      expect(result.id).toBe('tx-reversal');
    });

    it('should throw NotFoundException for non-existent transaction', async () => {
      const tx = { gOCASH_Transaction: { findUnique: jest.fn().mockResolvedValue(null) } };
      prisma.$transaction.mockImplementation((fn: any) => fn(tx));

      await expect(service.reverse('bad-id', 'reason', 'admin-1')).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if already reversed', async () => {
      const tx = { gOCASH_Transaction: { findUnique: jest.fn().mockResolvedValue({ ...mockTransaction, status: 'REVERSED' }) } };
      prisma.$transaction.mockImplementation((fn: any) => fn(tx));

      await expect(service.reverse('tx-1', 'reason', 'admin-1')).rejects.toThrow(BadRequestException);
    });
  });

  describe('redeem', () => {
    it('should create a pending redemption', async () => {
      prisma.gOCASH_Wallet.findUnique.mockResolvedValue(mockWallet);
      const tx = { gOCASH_Wallet: { findUnique: jest.fn().mockResolvedValue(mockWallet) }, gOCASH_Redemption: { create: jest.fn().mockResolvedValue(mockRedemption) } };
      prisma.$transaction.mockImplementation((fn: any) => fn(tx));

      const result = await service.redeem('wallet-1', 500, 'BANK_TRANSFER');

      expect(result.status).toBe('PENDING');
    });

    it('should throw for insufficient balance', async () => {
      const tx = { gOCASH_Wallet: { findUnique: jest.fn().mockResolvedValue({ ...mockWallet, availableBalance: 100 }) }, gOCASH_Redemption: { create: jest.fn() } };
      prisma.$transaction.mockImplementation((fn: any) => fn(tx));

      await expect(service.redeem('wallet-1', 500, 'BANK_TRANSFER')).rejects.toThrow(BadRequestException);
    });
  });

  describe('approveRedemption', () => {
    it('should approve a pending redemption and debit wallet', async () => {
      const debitTx = { ...mockTransaction, direction: 'DEBIT' as const };
      const tx = { gOCASH_Redemption: { findUnique: jest.fn().mockResolvedValue(mockRedemption), update: jest.fn() }, gOCASH_Wallet: { findUnique: jest.fn().mockResolvedValue(mockWallet), update: jest.fn() }, gOCASH_Transaction: { create: jest.fn().mockResolvedValue(debitTx) } };
      prisma.$transaction.mockImplementation((fn: any) => fn(tx));

      const result = await service.approveRedemption('redemption-1', 'admin-1');

      expect(result.redemption.status).toBe('APPROVED');
      expect(result.transaction.direction).toBe('DEBIT');
    });

    it('should throw if redemption not found', async () => {
      const tx = { gOCASH_Redemption: { findUnique: jest.fn().mockResolvedValue(null) } };
      prisma.$transaction.mockImplementation((fn: any) => fn(tx));

      await expect(service.approveRedemption('bad-id', 'admin-1')).rejects.toThrow(NotFoundException);
    });

    it('should throw if redemption not PENDING', async () => {
      const approved = { ...mockRedemption, status: 'APPROVED' as const, wallet: mockWallet };
      const tx = { gOCASH_Redemption: { findUnique: jest.fn().mockResolvedValue(approved) } };
      prisma.$transaction.mockImplementation((fn: any) => fn(tx));

      await expect(service.approveRedemption('redemption-1', 'admin-1')).rejects.toThrow(BadRequestException);
    });
  });

  describe('rejectRedemption', () => {
    it('should reject a pending redemption', async () => {
      prisma.gOCASH_Redemption.findUnique.mockResolvedValue(mockRedemption);
      prisma.gOCASH_Redemption.update.mockResolvedValue({ ...mockRedemption, status: 'REJECTED', rejectedAt: new Date(), rejectionReason: 'Insufficient KYC' });

      const result = await service.rejectRedemption('redemption-1', 'Insufficient KYC');

      expect(result.status).toBe('REJECTED');
      expect(result.rejectionReason).toBe('Insufficient KYC');
    });
  });

  describe('getBalance', () => {
    it('should return wallet balance', async () => {
      prisma.gOCASH_Wallet.findUnique.mockResolvedValue(mockWallet);

      const result = await service.getBalance('wallet-1');

      expect(result.currentBalance).toBe(1000);
    });

    it('should throw if wallet not found', async () => {
      prisma.gOCASH_Wallet.findUnique.mockResolvedValue(null);

      await expect(service.getBalance('bad-id')).rejects.toThrow(NotFoundException);
    });
  });

  describe('getLedger', () => {
    it('should return paginated ledger with filters', async () => {
      prisma.gOCASH_Transaction.findMany.mockResolvedValue([mockTransaction]);
      prisma.gOCASH_Transaction.count.mockResolvedValue(1);

      const result = await service.getLedger('wallet-1', { page: 1, limit: 10, direction: 'CREDIT' });

      expect(result.data).toHaveLength(1);
      expect(result.meta.total).toBe(1);
      expect(result.meta.page).toBe(1);
    });
  });

  describe('adminGetWalletStats', () => {
    it('should return aggregated wallet stats', async () => {
      prisma.gOCASH_Wallet.aggregate.mockResolvedValue({ _count: { id: 10 }, _sum: { currentBalance: 50000, availableBalance: 45000, lockedBalance: 5000, lifetimeEarned: 200000, lifetimeRedeemed: 150000 } } as any);
      prisma.gOCASH_Wallet.count.mockResolvedValue(5);

      const result = await service.adminGetWalletStats();

      expect(result.totalWallets).toBe(10);
      expect(result.totalBalance).toBe(50000);
      expect(result.activeWallets).toBe(5);
    });
  });
});
