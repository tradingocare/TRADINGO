import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { getQueueToken } from '@nestjs/bullmq';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { PrismaService } from '../../prisma/prisma.service';
import { RedisService } from '../../common/services/redis.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { TurnstileGuard } from '../../common/guards/turnstile.guard';
import { SmsService } from '../sms/sms.service';
import { AuditLogService } from '../audit-log/audit-log.service';
import { NotificationService } from '../notification/notification.service';
import { MembershipService } from '../membership/membership.service';
import { VendorCodesService } from '../vendor-codes/vendor-codes.service';
import { CatalogClassifyService } from '../marketplace-catalog-bridge/catalog-classify.service';
import { CatalogTaxonomyPersistenceService } from '../marketplace-catalog-bridge/catalog-taxonomy-persistence.service';
import { CanActivate } from '@nestjs/common';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

const mockPrisma = {
  user: { findUnique: jest.fn(), findFirst: jest.fn(), create: jest.fn(), update: jest.fn().mockResolvedValue({ id: 'user-1', email: 'vendor@example.com', name: 'Test', role: 'SELLER', permissions: [] }) },
  session: { create: jest.fn(), findUnique: jest.fn(), update: jest.fn().mockResolvedValue(undefined), delete: jest.fn(), deleteMany: jest.fn(), updateMany: jest.fn().mockResolvedValue({ count: 1 }) },
  company: { create: jest.fn().mockResolvedValue({ id: 'company-1', assignedRmId: null, assignedAt: null, name: 'Test Biz' }), findFirst: jest.fn().mockResolvedValue(null), update: jest.fn().mockResolvedValue({}) },
  companyOwner: { create: jest.fn().mockResolvedValue({}), findMany: jest.fn().mockResolvedValue([]) },
  companyLocation: { create: jest.fn().mockResolvedValue({}) },
  category: { findMany: jest.fn().mockResolvedValue([]) },
  catalogCategory: { count: jest.fn().mockResolvedValue(1) },
  companyCategory: { createMany: jest.fn().mockResolvedValue({ count: 0 }) },
  sellerPayoutAccount: { upsert: jest.fn().mockResolvedValue({}) },
  newsletterSubscriber: { upsert: jest.fn().mockResolvedValue({}) },
  auditLog: { create: jest.fn().mockResolvedValue({}) },
  $transaction: undefined as unknown as jest.Mock,
};
(mockPrisma.$transaction as jest.Mock) = jest.fn(async (fn: (tx: unknown) => unknown) => fn(mockPrisma));
const mockRedis = { get: jest.fn(), set: jest.fn(), del: jest.fn(), exists: jest.fn(), incr: jest.fn(), expire: jest.fn() };
const mockJwt = { sign: jest.fn(), verify: jest.fn() };
const mockConfig = { get: jest.fn() };
const mockEmailQueue = { add: jest.fn() };
const mockNotificationService = { create: jest.fn().mockResolvedValue({ id: 'notif-1' }), createWithTemplate: jest.fn().mockResolvedValue({ id: 'notif-1' }), upsertPreference: jest.fn().mockResolvedValue({ id: 'pref-1' }), initializeDefaultPreferences: jest.fn().mockResolvedValue(undefined) };
const mockMembershipService = { enrollTrial: jest.fn().mockResolvedValue({ success: true, status: 'TRIAL' }) };
const mockVendorCodesService = { assignReferral: jest.fn().mockResolvedValue(undefined), getCodeOwner: jest.fn().mockResolvedValue({ type: 'RM', userId: 'rm-1', name: 'RM' }) };
const mockEventEmitter = { emit: jest.fn() };
// F-06 defaults mirror auth.service.spec.ts: 'Steel' resolves exactly with a
// legacy twin so flow tests keep exercising the success path.
const mockCatalogClassify = { resolveCategoryText: jest.fn().mockResolvedValue({ categoryId: 'cc-1', categoryName: 'Steel', matchType: 'exact' }) };
const mockTaxonomyPersistence = { bridgeLegacyCategoryId: jest.fn().mockResolvedValue('legacy-1') };

jest.mock('bcrypt', () => ({
  hash: jest.fn().mockResolvedValue('hashed-password'),
  compare: jest.fn().mockResolvedValue(true),
}));
jest.mock('uuid', () => ({ v4: jest.fn().mockReturnValue('mock-session-id') }));
jest.mock('crypto', () => ({
  ...jest.requireActual('crypto'),
  randomBytes: jest.fn().mockReturnValue({ toString: jest.fn().mockReturnValue('mock-token') }),
  createHash: jest.fn().mockReturnValue({ update: jest.fn().mockReturnValue({ digest: jest.fn().mockReturnValue('hashed-refresh-token') }) }),
}));

describe('Auth Flow Integration', () => {
  let controller: AuthController;
  let service: AuthService;

  function configureModule() {
    jest.clearAllMocks();
    mockConfig.get.mockImplementation((key: string) => {
      if (key === 'jwt.secret') return 'test-secret';
      if (key === 'jwt.refreshSecret') return 'test-refresh-secret';
      if (key === 'jwt.expiresIn') return '15m';
      if (key === 'jwt.refreshExpiresIn') return '7d';
      return undefined;
    });
    mockJwt.sign.mockReturnValue('mock-access-token');
    mockJwt.verify.mockReturnValue({ sub: 'user-1', sessionId: 'session-1' });
  }

  beforeEach(async () => {
    configureModule();
    const mockGuard: CanActivate = { canActivate: jest.fn(() => true) };
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        AuthService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: RedisService, useValue: mockRedis },
        { provide: JwtService, useValue: mockJwt },
        { provide: ConfigService, useValue: mockConfig },
        { provide: getQueueToken('email'), useValue: mockEmailQueue },
        { provide: SmsService, useValue: { send: jest.fn(), sendOtp: jest.fn(), sendTransactional: jest.fn() } },
        { provide: AuditLogService, useValue: { log: jest.fn().mockResolvedValue(undefined), create: jest.fn().mockResolvedValue(undefined) } },
        { provide: NotificationService, useValue: mockNotificationService },
        { provide: MembershipService, useValue: mockMembershipService },
        { provide: VendorCodesService, useValue: mockVendorCodesService },
        { provide: CatalogClassifyService, useValue: mockCatalogClassify },
        { provide: CatalogTaxonomyPersistenceService, useValue: mockTaxonomyPersistence },
        { provide: EventEmitter2, useValue: mockEventEmitter },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue(mockGuard)
      .overrideGuard(TurnstileGuard)
      .useValue(mockGuard)
      .compile();

    controller = module.get<AuthController>(AuthController);
    service = module.get<AuthService>(AuthService);
  });

  afterEach(() => { jest.restoreAllMocks(); });

  describe('Registration Flow', () => {
    it('completes full registration successfully', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      mockPrisma.user.create.mockResolvedValue({ id: 'user-1', email: 'test@example.com', name: 'Test', role: 'USER' });
      mockPrisma.session.create.mockResolvedValue({ id: 'session-1' });

      const result = await controller.register({ email: 'test@example.com', password: 'Pass1234!', name: 'Test' });

      expect(result.user.email).toBe('test@example.com');
      expect(result.accessToken).toBe('mock-access-token');
      expect(result.refreshToken).toBe('mock-access-token');
      expect(mockPrisma.user.create).toHaveBeenCalledWith(expect.objectContaining({
        data: expect.objectContaining({ email: 'test@example.com' }),
      }));
      expect(mockEmailQueue.add).toHaveBeenCalled();
    });

    it('rejects duplicate email', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ id: 'existing' });

      await expect(controller.register({ email: 'dup@example.com', password: 'Pass1234!', name: 'Test' }))
        .rejects.toThrow('Email already registered');
    });
  });

  describe('Login Flow', () => {
    it('completes login with valid credentials', async () => {
      mockRedis.exists.mockResolvedValue(false);
      mockPrisma.user.findFirst.mockResolvedValue({ id: 'user-1', email: 'test@example.com', name: 'Test', role: 'USER', passwordHash: 'hash', isActive: true, loginAttempts: 0, lockedUntil: null, permissions: [], mobile: null, panNumber: null, status: 'active' });
      mockPrisma.session.deleteMany.mockResolvedValue({ count: 0 });
      mockPrisma.session.create.mockResolvedValue({ id: 'session-1' });
      mockPrisma.user.update.mockResolvedValue({});

      const result = await controller.login({ identifier: 'test@example.com', password: 'Pass1234!' });

      expect(result.user.email).toBe('test@example.com');
      expect(result.accessToken).toBe('mock-access-token');
    });

    it('rejects invalid credentials', async () => {
      mockRedis.exists.mockResolvedValue(false);
      mockPrisma.user.findFirst.mockResolvedValue(null);
      mockRedis.incr.mockResolvedValue(1);

      await expect(controller.login({ identifier: 'bad@example.com', password: 'WrongPass1!' }))
        .rejects.toThrow('Invalid credentials');
    });

    it('rejects locked account', async () => {
      mockRedis.exists.mockResolvedValue(true);

      await expect(controller.login({ identifier: 'locked@example.com', password: 'Pass1234!' }))
        .rejects.toThrow('Invalid credentials');
    });

    it('locks account after max failed attempts', async () => {
      mockRedis.exists.mockResolvedValue(false);
      mockPrisma.user.findFirst.mockResolvedValue({ id: 'user-1', email: 'test@example.com', passwordHash: 'hash', isActive: true, loginAttempts: 0, lockedUntil: null, mobile: null, panNumber: null, status: 'active', permissions: [], role: 'VIEWER' });
      const bcrypt = require('bcrypt');
      bcrypt.compare.mockResolvedValue(false);
      mockRedis.incr.mockResolvedValue(3);

      await expect(controller.login({ identifier: 'test@example.com', password: 'WrongPass1!' }))
        .rejects.toThrow('Incorrect password');
      expect(mockRedis.expire).toHaveBeenCalled();
      expect(mockPrisma.user.update).toHaveBeenCalledWith(expect.objectContaining({
        data: expect.objectContaining({ loginAttempts: 3 }),
      }));
    });
  });

  describe('Token Refresh Flow', () => {
    it('completes refresh with valid token', async () => {
      mockJwt.verify.mockReturnValue({ sub: 'user-1', sessionId: 'session-1' });
      mockPrisma.session.findUnique.mockResolvedValue({
        id: 'session-1',
        expiresAt: new Date(Date.now() + 86400000),
        user: { id: 'user-1', email: 'test@example.com', role: 'USER', permissions: [] },
        userAgent: null,
        ipAddress: null,
      });
      mockPrisma.session.delete.mockResolvedValue({});
      mockPrisma.session.create.mockResolvedValue({ id: 'session-2' });

      const result = await controller.refresh({ refreshToken: 'valid-refresh-token' });

      expect(result.accessToken).toBe('mock-access-token');
      expect(mockPrisma.session.updateMany).toHaveBeenCalledWith({ where: { id: 'session-1', isActive: true }, data: { isActive: false } });
    });

    it('rejects expired session', async () => {
      mockJwt.verify.mockReturnValue({ sub: 'user-1', sessionId: 'session-1' });
      mockPrisma.session.findUnique.mockResolvedValue({
        id: 'session-1',
        expiresAt: new Date(Date.now() - 86400000),
        user: { id: 'user-1', email: 'test@example.com', role: 'USER', permissions: [] },
      });

      await expect(controller.refresh({ refreshToken: 'expired-token' })).rejects.toThrow('Session expired');
    });
  });

  describe('Logout Flow', () => {
    it('logs out specific session when refresh token provided', async () => {
      mockJwt.verify.mockReturnValue({ sub: 'user-1', sessionId: 'session-1' });
      mockPrisma.session.update.mockResolvedValue(undefined);

      await controller.logout('user-1', 'valid-refresh-token');

      expect(mockPrisma.session.update).toHaveBeenCalledWith({ where: { id: 'session-1' }, data: { isActive: false } });
    });

    it('deletes all sessions on logout without token', async () => {
      mockPrisma.session.updateMany.mockResolvedValue({ count: 2 });

      await controller.logout('user-1', undefined);

      expect(mockPrisma.session.updateMany).toHaveBeenCalledWith({ where: { userId: 'user-1' }, data: { isActive: false } });
    });

    it('deletes all sessions when refresh token is invalid', async () => {
      mockJwt.verify.mockImplementation(() => { throw new Error('Invalid token'); });
      mockPrisma.session.updateMany.mockResolvedValue({ count: 2 });

      await controller.logout('user-1', 'bad-token');

      expect(mockPrisma.session.updateMany).toHaveBeenCalledWith({ where: { userId: 'user-1' }, data: { isActive: false } });
    });
  });

  describe('Email Verification Flow', () => {
    it('verifies email with valid token', async () => {
      mockRedis.get.mockResolvedValue('user-1');
      mockPrisma.user.update.mockResolvedValue({});

      const result = await controller.verifyEmail({ token: 'valid-token' });

      expect(result.message).toBe('Email verified successfully');
      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        data: { emailVerifiedAt: expect.any(Date) },
      });
      expect(mockRedis.del).toHaveBeenCalledWith('verify:email:valid-token');
    });

    it('rejects invalid verification token', async () => {
      mockRedis.get.mockResolvedValue(null);

      await expect(controller.verifyEmail({ token: 'bad-token' }))
        .rejects.toThrow('Invalid or expired verification token');
    });
  });

  describe('Vendor Onboarding Flow', () => {
    const vendorDto = {
      businessName: 'Test Biz',
      businessType: 'Private Limited',
      sellerType: 'Manufacturer',
      yearEstablished: '2020',
      totalEmployees: '10',
      annualTurnover: '1 Cr',
      ownerName: 'Owner',
      designation: 'Director',
      email: 'vendor@example.com',
      mobileNumber: '9876543210',
      password: 'Pass@1234',
      panNumber: 'ABCDE1234F',
      panHolderName: 'Owner',
      hasGst: false,
      primaryCategory: 'Steel',
      planId: 'trade_smart',
      referralCode: 'REF1',
      rmCode: 'RM1',
      accountHolderName: 'Owner',
      accountNumber: '1234567890',
      ifscCode: 'SBIN0001234',
      accountType: 'current',
    } as any;

    it('activates vendor with plan, referral, RM and payout details', async () => {
      mockPrisma.user.findFirst.mockResolvedValue({ id: 'user-1', email: 'vendor@example.com', name: 'Test', role: 'BUYER', mobile: null, panNumber: null, status: 'active', permissions: [], isActive: true });

      const result = await controller.vendorOnboarding('user-1', vendorDto);

      expect(mockPrisma.$transaction).toHaveBeenCalled();
      expect(mockMembershipService.enrollTrial).toHaveBeenCalledWith('company-1', 'trade_smart', mockPrisma);
      expect(mockVendorCodesService.assignReferral).toHaveBeenCalledWith('company-1', 'REF1', mockPrisma);
      expect(mockPrisma.company.update).toHaveBeenCalledWith(expect.objectContaining({
        where: { id: 'company-1' },
        data: expect.objectContaining({ assignedRmId: 'rm-1' }),
      }));
      expect(mockPrisma.auditLog.create).toHaveBeenCalledWith(expect.objectContaining({
        data: expect.objectContaining({ action: 'ASSIGN_RM' }),
      }));
      expect(mockPrisma.sellerPayoutAccount.upsert).toHaveBeenCalled();
      expect(result.companyId).toBe('company-1');
    });

    it('preserves an existing RM assignment', async () => {
      mockPrisma.user.findFirst.mockResolvedValue({ id: 'user-1', email: 'vendor@example.com', name: 'Test', role: 'BUYER', mobile: null, panNumber: null, status: 'active', permissions: [], isActive: true });
      mockPrisma.company.create.mockResolvedValueOnce({ id: 'company-1', assignedRmId: 'rm-99', assignedAt: new Date(), name: 'Test Biz' });

      const result = await controller.vendorOnboarding('user-1', vendorDto);

      expect(mockPrisma.company.update).not.toHaveBeenCalled();
      expect(mockPrisma.auditLog.create).not.toHaveBeenCalledWith(expect.objectContaining({
        data: expect.objectContaining({ action: 'ASSIGN_RM' }),
      }));
      expect(result.companyId).toBe('company-1');
    });

    it('rolls back without side effects when enrollment fails', async () => {
      mockPrisma.user.findFirst.mockResolvedValue({ id: 'user-1', email: 'vendor@example.com', name: 'Test', role: 'BUYER', mobile: null, panNumber: null, status: 'active', permissions: [], isActive: true });
      mockMembershipService.enrollTrial.mockRejectedValueOnce(new Error('plan failure'));

      await expect(controller.vendorOnboarding('user-1', vendorDto)).rejects.toThrow('plan failure');

      expect(mockPrisma.$transaction).toHaveBeenCalled();
      expect(mockPrisma.user.update).not.toHaveBeenCalled();
      expect(mockPrisma.auditLog.create).not.toHaveBeenCalled();
      expect(mockPrisma.sellerPayoutAccount.upsert).not.toHaveBeenCalled();
      expect(mockEventEmitter.emit).not.toHaveBeenCalled();
      expect(mockEmailQueue.add).not.toHaveBeenCalled();
    });
  });

  describe('Buyer Registration Flow', () => {
    const buyerDto = {
      email: 'buyer@example.com',
      password: 'Pass@1234',
      fullName: 'Buyer',
      companyName: 'Buy Co',
      businessType: 'Private Limited',
      mobileNumber: '9876543210',
      industry: 'Steel',
      companySize: '10',
      annualProcurement: '10 Cr',
      addressLine1: 'Addr',
      city: 'Patna',
      district: 'Patna',
      state: 'Bihar',
      pincode: '800001',
      notificationEmail: true,
      notificationSms: false,
      newsletter: true,
    } as any;

    it('registers buyer transactionally with preferences and newsletter', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      mockPrisma.user.create.mockResolvedValue({ id: 'user-1', email: 'buyer@example.com', name: 'Buyer', role: 'BUYER', permissions: [] });
      mockPrisma.session.create.mockResolvedValue({ id: 'session-1' });

      const result = await controller.registerBuyer(buyerDto);

      expect(mockPrisma.$transaction).toHaveBeenCalled();
      expect(mockNotificationService.initializeDefaultPreferences).toHaveBeenCalledWith('company-1', 'user-1', mockPrisma);
      expect(mockNotificationService.upsertPreference).toHaveBeenCalledTimes(2);
      expect(mockPrisma.newsletterSubscriber.upsert).toHaveBeenCalled();
      expect(result.companyId).toBe('company-1');
      expect(mockEmailQueue.add).toHaveBeenCalled();
    });

    it('rolls back without side effects when preference initialization fails', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      mockPrisma.user.create.mockResolvedValue({ id: 'user-1', email: 'buyer@example.com', name: 'Buyer', role: 'BUYER', permissions: [] });
      mockNotificationService.initializeDefaultPreferences.mockRejectedValueOnce(new Error('pref failure'));

      await expect(controller.registerBuyer(buyerDto)).rejects.toThrow('pref failure');

      expect(mockPrisma.$transaction).toHaveBeenCalled();
      expect(mockPrisma.newsletterSubscriber.upsert).not.toHaveBeenCalled();
      expect(mockPrisma.session.create).not.toHaveBeenCalled();
      expect(mockEmailQueue.add).not.toHaveBeenCalled();
    });
  });
});
