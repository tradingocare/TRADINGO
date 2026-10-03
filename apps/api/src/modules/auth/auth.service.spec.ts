import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { getQueueToken } from '@nestjs/bullmq';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { AuthService } from './auth.service';
import { PrismaService } from '../../prisma/prisma.service';
import { RedisService } from '../../common/services/redis.service';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { SmsService } from '../sms/sms.service';
import { AuditLogService } from '../audit-log/audit-log.service';
import { NotificationService } from '../notification/notification.service';
import { MembershipService } from '../membership/membership.service';
import { VendorCodesService } from '../vendor-codes/vendor-codes.service';
import { CatalogClassifyService } from '../marketplace-catalog-bridge/catalog-classify.service';
import { CatalogTaxonomyPersistenceService } from '../marketplace-catalog-bridge/catalog-taxonomy-persistence.service';

jest.mock('bcrypt', () => ({
  hash: jest.fn().mockResolvedValue('hashed-password'),
  compare: jest.fn().mockResolvedValue(true),
}));
import * as bcrypt from 'bcrypt';

interface MockPrisma {
  user: Record<string, jest.Mock>;
  session: Record<string, jest.Mock>;
  company: Record<string, jest.Mock>;
  companyOwner: Record<string, jest.Mock>;
  companyLocation: Record<string, jest.Mock>;
  category: Record<string, jest.Mock>;
  catalogCategory: Record<string, jest.Mock>;
  companyCategory: Record<string, jest.Mock>;
  sellerPayoutAccount: Record<string, jest.Mock>;
  newsletterSubscriber: Record<string, jest.Mock>;
  auditLog: Record<string, jest.Mock>;
  $transaction: jest.Mock;
}

interface MockRedis {
  get: jest.Mock;
  set: jest.Mock;
  del: jest.Mock;
  incr: jest.Mock;
  expire: jest.Mock;
  exists: jest.Mock;
  ttl: jest.Mock;
}

interface MockJwt {
  sign: jest.Mock;
  verify: jest.Mock;
}

interface MockQueue {
  add: jest.Mock;
}

describe('AuthService', () => {
  let service: AuthService;
  let prisma: MockPrisma;
  let redisService: MockRedis;
  let jwtService: MockJwt;
  let emailQueue: MockQueue;
  let notificationService: Record<string, jest.Mock>;
  let membershipService: Record<string, jest.Mock>;
  let vendorCodesService: Record<string, jest.Mock>;
  let catalogClassifyService: { resolveCategoryText: jest.Mock };
  let taxonomyPersistenceService: { bridgeLegacyCategoryId: jest.Mock };
  let eventEmitter: { emit: jest.Mock };

  const mockUser = {
    id: 'user-1',
    email: 'test@example.com',
    mobile: null,
    panNumber: null,
    name: 'Test',
    role: 'VIEWER',
    status: 'active',
    permissions: [],
    passwordHash: 'hashed',
    isActive: true,
  };

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
    description: 'desc',
    primaryCategory: 'Steel',
    productTypes: 'Pipes',
    moqRange: '1-10',
    supplyCapacity: '100',
    leadTime: '7 days',
    exportCapability: false,
    addressLine1: 'Addr',
    city: 'Patna',
    district: 'Patna',
    state: 'Bihar',
    pincode: '800001',
    accountHolderName: 'Owner',
    accountNumber: '1234567890',
    ifscCode: 'SBIN0001234',
    accountType: 'current',
    planId: 'trade_smart',
    referralCode: 'REF1',
    rmCode: 'RM1',
  } as any;

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

  beforeEach(async () => {
    prisma = {
      user: {
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        create: jest.fn(),
        update: jest.fn().mockResolvedValue({ id: 'user-1', email: 'vendor@example.com', name: 'Test', role: 'SELLER', permissions: [] }),
      },
      session: {
        create: jest.fn(),
        findUnique: jest.fn(),
        delete: jest.fn(),
        deleteMany: jest.fn(),
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
      },
      company: {
        create: jest.fn().mockResolvedValue({ id: 'company-1', assignedRmId: null, assignedAt: null, name: 'Test Biz' }),
        findFirst: jest.fn().mockResolvedValue(null),
        update: jest.fn().mockResolvedValue({}),
      },
      companyOwner: {
        create: jest.fn().mockResolvedValue({}),
        findMany: jest.fn().mockResolvedValue([]),
        findFirst: jest.fn().mockResolvedValue(null),
      },
      companyLocation: { create: jest.fn().mockResolvedValue({}), findFirst: jest.fn().mockResolvedValue(null) },
      category: { findMany: jest.fn().mockResolvedValue([]) },
      catalogCategory: { count: jest.fn().mockResolvedValue(1) },
      companyCategory: { createMany: jest.fn().mockResolvedValue({ count: 0 }) },
      sellerPayoutAccount: { upsert: jest.fn().mockResolvedValue({}) },
      newsletterSubscriber: { upsert: jest.fn().mockResolvedValue({}) },
      auditLog: { create: jest.fn().mockResolvedValue({}) },
      $transaction: jest.fn(async (fn: (tx: unknown) => unknown) => fn(prisma)),
    };

    redisService = {
      get: jest.fn(),
      set: jest.fn(),
      del: jest.fn(),
      incr: jest.fn(),
      expire: jest.fn(),
      exists: jest.fn(),
      ttl: jest.fn(),
    };

    jwtService = {
      sign: jest.fn().mockReturnValue('mock-token'),
      verify: jest.fn(),
    };

    emailQueue = { add: jest.fn() };
    notificationService = {
      create: jest.fn().mockResolvedValue({ id: 'notif-1' }),
      createWithTemplate: jest.fn().mockResolvedValue({ id: 'notif-1' }),
      upsertPreference: jest.fn().mockResolvedValue({ id: 'pref-1' }),
      initializeDefaultPreferences: jest.fn().mockResolvedValue(undefined),
    };
    membershipService = { enrollTrial: jest.fn().mockResolvedValue({ success: true, status: 'TRIAL' }) };
    vendorCodesService = {
      assignReferral: jest.fn().mockResolvedValue(undefined),
      getCodeOwner: jest.fn().mockResolvedValue({ type: 'RM', userId: 'rm-1', name: 'RM' }),
    };
    eventEmitter = { emit: jest.fn() };
    // F-06 defaults: 'Steel' resolves exactly to one canonical category with
    // a legacy twin, so pre-existing flow tests (which are not about taxonomy)
    // keep exercising the success path.
    catalogClassifyService = {
      resolveCategoryText: jest.fn().mockResolvedValue({ categoryId: 'cc-1', categoryName: 'Steel', matchType: 'exact' }),
    };
    taxonomyPersistenceService = { bridgeLegacyCategoryId: jest.fn().mockResolvedValue('legacy-1') };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: prisma },
        { provide: RedisService, useValue: redisService },
        { provide: getQueueToken('email'), useValue: emailQueue },
        { provide: JwtService, useValue: jwtService },
        { provide: SmsService, useValue: { send: jest.fn(), sendOtp: jest.fn(), sendTransactional: jest.fn() } },
        { provide: AuditLogService, useValue: { log: jest.fn().mockResolvedValue(undefined), create: jest.fn().mockResolvedValue(undefined) } },
        { provide: NotificationService, useValue: notificationService },
        { provide: MembershipService, useValue: membershipService },
        { provide: VendorCodesService, useValue: vendorCodesService },
        { provide: CatalogClassifyService, useValue: catalogClassifyService },
        { provide: CatalogTaxonomyPersistenceService, useValue: taxonomyPersistenceService },
        { provide: EventEmitter2, useValue: eventEmitter },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string, defaultValue?: unknown) => {
              const config: Record<string, unknown> = {
                'jwt.refreshSecret': 'refresh-secret',
                'jwt.refreshExpiresIn': '7d',
              };
              return config[key] ?? defaultValue;
            }),
          },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('register', () => {
    it('creates user, session, queues welcome email, and stores verification token', async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      prisma.user.create.mockResolvedValue(mockUser);
      prisma.session.create.mockResolvedValue({ id: 'session-1' });

      const result = await service.register({ email: 'test@example.com', password: 'Pass@1234', name: 'Test' });

      expect(prisma.user.create).toHaveBeenCalled();
      expect(prisma.session.create).toHaveBeenCalled();
      expect(emailQueue.add).toHaveBeenCalled();
      expect(redisService.set).toHaveBeenCalledWith(
        expect.stringContaining('verify:email:'),
        mockUser.id,
        86400,
      );
      expect(result.user.email).toBe('test@example.com');
      expect(result.accessToken).toBe('mock-token');
    });

    it('throws ConflictException if email exists', async () => {
      prisma.user.findUnique.mockResolvedValue(mockUser);
      await expect(service.register({ email: 'test@example.com', password: 'Pass@1234', name: 'Test' }))
        .rejects.toThrow(ConflictException);
    });
  });

  describe('login', () => {
    it('succeeds with valid credentials', async () => {
      redisService.exists.mockResolvedValue(false);
      prisma.user.findFirst.mockResolvedValue(mockUser);
      prisma.user.update.mockResolvedValue({});
      prisma.session.deleteMany.mockResolvedValue({ count: 0 });
      prisma.session.create.mockResolvedValue({ id: 'session-1' });

      const result = await service.login({ identifier: 'test@example.com', password: 'Pass@1234' });

      expect(result.accessToken).toBe('mock-token');
      expect(prisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ loginAttempts: 0 }) }),
      );
    });

    it('fails with wrong password', async () => {
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);
      redisService.exists.mockResolvedValue(false);
      redisService.incr.mockResolvedValue(1);
      prisma.user.findFirst.mockResolvedValue(mockUser);

      await expect(service.login({ identifier: 'test@example.com', password: 'wrong' }))
        .rejects.toThrow(UnauthorizedException);
    });

    it('locks account after 3 failed attempts', async () => {
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);
      redisService.exists.mockResolvedValue(false);
      redisService.incr.mockResolvedValue(3);
      prisma.user.findFirst.mockResolvedValue(mockUser);
      prisma.user.update.mockResolvedValue({});

      await expect(service.login({ identifier: 'test@example.com', password: 'wrong' }))
        .rejects.toThrow(UnauthorizedException);
      expect(prisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ loginAttempts: 3 }) }),
      );
    });

    it('rejects locked account with generic message', async () => {
      redisService.exists.mockResolvedValue(true);
      await expect(service.login({ identifier: 'test@example.com', password: 'Pass@1234' }))
        .rejects.toThrow(UnauthorizedException);
    });

    it('calls handleFailedLogin for non-existent user', async () => {
      redisService.exists.mockResolvedValue(false);
      redisService.incr.mockResolvedValue(1);
      prisma.user.findFirst.mockResolvedValue(null);

      await expect(service.login({ identifier: 'nonexistent@example.com', password: 'any' }))
        .rejects.toThrow(UnauthorizedException);
      expect(redisService.incr).toHaveBeenCalledWith('lock:user:nonexistent@example.com');
    });

    it('resolves PAN login through CompanyOwner when User.panNumber is null', async () => {
      const sellerUser = {
        id: 'seller-1',
        email: 'seller@example.com',
        mobile: '9876543210',
        panNumber: null,
        name: 'Seller',
        role: 'SELLER',
        status: 'active',
        permissions: [],
        passwordHash: 'hashed',
        isActive: true,
      };
      redisService.exists.mockResolvedValue(false);
      prisma.user.findFirst.mockResolvedValue(null);
      prisma.companyOwner.findFirst.mockResolvedValue({ user: sellerUser });
      prisma.user.update.mockResolvedValue({});
      prisma.session.create.mockResolvedValue({ id: 'session-1' });
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await service.login({ identifier: 'aakcn7471r', password: 'Pass@1234', role: 'vendor' });

      expect(result.accessToken).toBe('mock-token');
      expect(prisma.companyOwner.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ company: { panNumber: 'AAKCN7471R' } }),
          include: { user: true },
        }),
      );
    });

    it('matches User.panNumber directly and never queries CompanyOwner', async () => {
      redisService.exists.mockResolvedValue(false);
      prisma.user.findFirst.mockResolvedValue({ ...mockUser, panNumber: 'ABCDE1234F', role: 'SELLER' });
      prisma.user.update.mockResolvedValue({});
      prisma.session.create.mockResolvedValue({ id: 'session-1' });
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await service.login({ identifier: 'ABCDE1234F', password: 'Pass@1234', role: 'vendor' });

      expect(result.accessToken).toBe('mock-token');
      expect(prisma.companyOwner.findFirst).not.toHaveBeenCalled();
    });

    it('rejects PAN not owned by any user with generic Invalid credentials', async () => {
      redisService.exists.mockResolvedValue(false);
      redisService.incr.mockResolvedValue(1);
      prisma.user.findFirst.mockResolvedValue(null);
      prisma.companyOwner.findFirst.mockResolvedValue(null);

      await expect(service.login({ identifier: 'ZZZZZ9999Z', password: 'Pass@1234' }))
        .rejects.toThrow(UnauthorizedException);
    });

    it('never resolves email/mobile identifiers through CompanyOwner', async () => {
      redisService.exists.mockResolvedValue(false);
      redisService.incr.mockResolvedValue(1);
      prisma.user.findFirst.mockResolvedValue(null);

      await expect(service.login({ identifier: 'someone@example.com', password: 'any' }))
        .rejects.toThrow(UnauthorizedException);
      expect(prisma.companyOwner.findFirst).not.toHaveBeenCalled();
    });

    describe('verifyEmail', () => {
      it('verifies email with valid token', async () => {
        redisService.get.mockResolvedValue('user-1');
        prisma.user.update.mockResolvedValue({});

        await service.verifyEmail('valid-token');

        expect(prisma.user.update).toHaveBeenCalledWith(
          expect.objectContaining({
            where: { id: 'user-1' },
            data: expect.objectContaining({ emailVerifiedAt: expect.any(Date) }),
          }),
        );
        expect(redisService.del).toHaveBeenCalledWith('verify:email:valid-token');
      });

      it('throws UnauthorizedException for invalid token', async () => {
        redisService.get.mockResolvedValue(null);
        await expect(service.verifyEmail('bad-token')).rejects.toThrow(UnauthorizedException);
      });
    });
  });

  describe('refreshTokens', () => {
    it('rotates session correctly', async () => {
      jest.spyOn(jwtService, 'verify').mockReturnValue({ sub: 'user-1', sessionId: 'session-1' });

      prisma.session.findUnique.mockResolvedValue({
        id: 'session-1',
        userId: 'user-1',
        userAgent: null,
        ipAddress: null,
        expiresAt: new Date(Date.now() + 86400000),
        user: mockUser,
      });
      prisma.session.delete.mockResolvedValue({});
      prisma.session.create.mockResolvedValue({ id: 'session-2' });

      const result = await service.refreshTokens('valid-refresh-token');
      expect(result.accessToken).toBe('mock-token');
    });

    it('throws UnauthorizedException for invalid token', async () => {
      jest.spyOn(jwtService, 'verify').mockImplementation(() => { throw new Error(); });

      await expect(service.refreshTokens('invalid-token'))
        .rejects.toThrow(UnauthorizedException);
    });
  });

  describe('vendorOnboarding', () => {
    function mockBuyerUser() {
      prisma.user.findFirst.mockResolvedValue({ ...mockUser, id: 'user-1', email: 'vendor@example.com', role: 'BUYER', mobile: null });
    }

    it('reuses an owned professional company when PAN matches (F6)', async () => {
      mockBuyerUser();
      prisma.companyOwner.findMany.mockResolvedValue([
        { userId: 'user-1', isPrimary: false, company: { id: 'prof-co', panNumber: 'AAAAA9999A', gstNumber: null, businessType: 'PROFESSIONAL', companyStructure: null, name: 'Prof Co' } },
      ]);
      prisma.company.update.mockResolvedValue({ id: 'prof-co' });

      const result = await service.vendorOnboarding('user-1', { ...vendorDto, panNumber: 'AAAAA9999A', planId: undefined, referralCode: undefined, rmCode: undefined });

      expect(prisma.company.create).not.toHaveBeenCalled();
      expect(prisma.company.update).toHaveBeenCalledWith(expect.objectContaining({ where: { id: 'prof-co' } }));
      expect(result.companyId).toBe('prof-co');
    });

    it('rejects a PAN that conflicts with an owned identity-bearing company (F7)', async () => {
      mockBuyerUser();
      prisma.companyOwner.findMany.mockResolvedValue([
        { userId: 'user-1', isPrimary: true, company: { id: 'prof-co', panNumber: 'AAAAA9999A', gstNumber: null, businessType: 'PROFESSIONAL', companyStructure: null, name: 'Prof Co' } },
      ]);

      await expect(service.vendorOnboarding('user-1', { ...vendorDto, panNumber: 'BBBBB9999B' }))
        .rejects.toThrow(ConflictException);
      expect(prisma.company.create).not.toHaveBeenCalled();
      expect(prisma.company.update).not.toHaveBeenCalled();
    });

    it('runs all persisted writes in a single transaction and completes activation', async () => {
      mockBuyerUser();

      const result = await service.vendorOnboarding('user-1', vendorDto);

      expect(prisma.$transaction).toHaveBeenCalledWith(expect.any(Function));
      expect(prisma.company.create).toHaveBeenCalled();
      expect(membershipService.enrollTrial).toHaveBeenCalledWith('company-1', 'trade_smart', prisma);
      expect(vendorCodesService.assignReferral).toHaveBeenCalledWith('company-1', expect.any(String), prisma);
      expect(prisma.company.update).toHaveBeenCalledWith(expect.objectContaining({
        where: { id: 'company-1' },
        data: expect.objectContaining({ assignedRmId: 'rm-1' }),
      }));
      expect(prisma.auditLog.create).toHaveBeenCalledWith(expect.objectContaining({
        data: expect.objectContaining({ action: 'ASSIGN_RM' }),
      }));
      expect(prisma.auditLog.create).toHaveBeenCalledWith(expect.objectContaining({
        data: expect.objectContaining({ action: 'VENDOR_ONBOARDING_COMPLETED' }),
      }));
      expect(prisma.sellerPayoutAccount.upsert).toHaveBeenCalled();
      expect(prisma.user.update).toHaveBeenCalledWith(expect.objectContaining({
        where: { id: 'user-1' },
        data: expect.objectContaining({ role: 'SELLER' }),
      }));
      expect(eventEmitter.emit).toHaveBeenCalled();
      expect(emailQueue.add).toHaveBeenCalled();
      expect(result.companyId).toBe('company-1');
    });

    it('rolls back and skips all side effects when a late membership step fails', async () => {
      mockBuyerUser();
      membershipService.enrollTrial.mockRejectedValueOnce(new Error('plan failure'));

      await expect(service.vendorOnboarding('user-1', vendorDto)).rejects.toThrow('plan failure');

      expect(prisma.$transaction).toHaveBeenCalledWith(expect.any(Function));
      expect(prisma.user.update).not.toHaveBeenCalled();
      expect(prisma.auditLog.create).not.toHaveBeenCalled();
      expect(prisma.sellerPayoutAccount.upsert).not.toHaveBeenCalled();
      expect(eventEmitter.emit).not.toHaveBeenCalled();
      expect(emailQueue.add).not.toHaveBeenCalled();
      expect(notificationService.create).not.toHaveBeenCalled();
    });

    it('preserves an existing assignedRmId and does not write ASSIGN_RM audit', async () => {
      mockBuyerUser();
      prisma.company.create.mockResolvedValueOnce({ id: 'company-1', assignedRmId: 'rm-99', assignedAt: new Date(), name: 'Test Biz' });

      const result = await service.vendorOnboarding('user-1', vendorDto);

      expect(prisma.company.update).not.toHaveBeenCalled();
      expect(prisma.auditLog.create).not.toHaveBeenCalledWith(expect.objectContaining({
        data: expect.objectContaining({ action: 'ASSIGN_RM' }),
      }));
      expect(result.companyId).toBe('company-1');
    });

    it('rejects an invalid rmCode inside the transaction', async () => {
      mockBuyerUser();
      vendorCodesService.getCodeOwner.mockResolvedValueOnce(null);

      await expect(service.vendorOnboarding('user-1', vendorDto)).rejects.toThrow(ConflictException);

      expect(prisma.auditLog.create).not.toHaveBeenCalled();
      expect(emailQueue.add).not.toHaveBeenCalled();
    });

    it('succeeds when all optional fields are omitted', async () => {
      mockBuyerUser();
      const minimal = { ...vendorDto, planId: undefined, referralCode: undefined, rmCode: undefined, accountNumber: undefined, ifscCode: undefined };

      const result = await service.vendorOnboarding('user-1', minimal);

      expect(membershipService.enrollTrial).not.toHaveBeenCalled();
      expect(vendorCodesService.assignReferral).not.toHaveBeenCalled();
      expect(prisma.company.update).not.toHaveBeenCalled();
      expect(prisma.sellerPayoutAccount.upsert).not.toHaveBeenCalled();
      expect(prisma.user.update).toHaveBeenCalledWith(expect.objectContaining({
        where: { id: 'user-1' },
        data: expect.objectContaining({ role: 'SELLER' }),
      }));
      expect(emailQueue.add).toHaveBeenCalled();
    });
  });


  describe('vendor Step-5 fail-closed category linking (F-06)', () => {
    function mockBuyerUser() {
      prisma.user.findFirst.mockResolvedValue({ ...mockUser, id: 'user-1', email: 'vendor@example.com', role: 'BUYER', mobile: null });
    }

    it('links the resolved legacy category for a unique name (CASE A)', async () => {
      mockBuyerUser();

      const result = await service.vendorOnboarding('user-1', vendorDto);

      expect(catalogClassifyService.resolveCategoryText).toHaveBeenCalledWith('Steel');
      expect(prisma.companyCategory.createMany).toHaveBeenCalledWith({
        data: [{ companyId: 'company-1', categoryId: 'legacy-1' }],
        skipDuplicates: true,
      });
      expect(result.companyId).toBe('company-1');
    });

    it('rejects 400 with no write when the name is unresolvable (CASE B)', async () => {
      mockBuyerUser();
      catalogClassifyService.resolveCategoryText.mockResolvedValue(null);

      await expect(service.vendorOnboarding('user-1', vendorDto)).rejects.toThrow(
        'Unknown business category: "Steel"',
      );

      expect(prisma.companyCategory.createMany).not.toHaveBeenCalled();
      expect(prisma.user.update).not.toHaveBeenCalled();
    });

    it('rejects 400 with no write when the name is ambiguous (CASE C, exact duplicates)', async () => {
      mockBuyerUser();
      prisma.catalogCategory.count.mockResolvedValueOnce(2);

      await expect(service.vendorOnboarding('user-1', vendorDto)).rejects.toThrow(
        'Ambiguous business category: "Steel"',
      );

      // Not multi-linked: nothing is written at all.
      expect(prisma.companyCategory.createMany).not.toHaveBeenCalled();
      expect(prisma.user.update).not.toHaveBeenCalled();
    });

    it('rejects 400 when a synonym-tier match is not unique (CASE C, fuzzy)', async () => {
      mockBuyerUser();
      catalogClassifyService.resolveCategoryText.mockResolvedValue({ categoryId: 'cc-9', categoryName: 'Alloy Steel', matchType: 'synonym' });
      prisma.catalogCategory.count.mockResolvedValueOnce(0).mockResolvedValueOnce(3);

      await expect(
        service.vendorOnboarding('user-1', { ...vendorDto, primaryCategory: 'alloy stee' }),
      ).rejects.toThrow('Ambiguous business category: "alloy stee"');

      expect(prisma.companyCategory.createMany).not.toHaveBeenCalled();
    });

    it('writes nothing when a later name fails after an earlier valid one (no partial linkage)', async () => {
      mockBuyerUser();
      catalogClassifyService.resolveCategoryText.mockImplementation(async (text: string) =>
        text === 'Steel'
          ? { categoryId: 'cc-1', categoryName: 'Steel', matchType: 'exact' }
          : null,
      );

      await expect(
        service.vendorOnboarding('user-1', { ...vendorDto, secondaryCategories: ['Zzz Not Real'] }),
      ).rejects.toThrow('Unknown business category: "Zzz Not Real"');

      // The valid first name is NOT partially linked.
      expect(prisma.companyCategory.createMany).not.toHaveBeenCalled();
      expect(prisma.user.update).not.toHaveBeenCalled();
    });

    it('normalizes case/whitespace through the resolver contract', async () => {
      mockBuyerUser();

      const result = await service.vendorOnboarding('user-1', { ...vendorDto, primaryCategory: '  sTeEl  ' });

      expect(catalogClassifyService.resolveCategoryText).toHaveBeenCalledWith('sTeEl');
      expect(prisma.companyCategory.createMany).toHaveBeenCalledWith({
        data: [{ companyId: 'company-1', categoryId: 'legacy-1' }],
        skipDuplicates: true,
      });
      expect(result.companyId).toBe('company-1');
    });

    it('treats empty category input as no-op success (CASE D preserved)', async () => {
      mockBuyerUser();

      const result = await service.vendorOnboarding('user-1', { ...vendorDto, primaryCategory: '', secondaryCategories: [] });

      expect(catalogClassifyService.resolveCategoryText).not.toHaveBeenCalled();
      expect(prisma.companyCategory.createMany).not.toHaveBeenCalled();
      expect(result.companyId).toBe('company-1');
    });

    it('rejects 400 when the resolved category has no legacy twin (no silent drop)', async () => {
      mockBuyerUser();
      taxonomyPersistenceService.bridgeLegacyCategoryId.mockResolvedValue(null);

      await expect(service.vendorOnboarding('user-1', vendorDto)).rejects.toThrow(
        'Business category "Steel" cannot be linked yet',
      );

      expect(prisma.companyCategory.createMany).not.toHaveBeenCalled();
      expect(prisma.user.update).not.toHaveBeenCalled();
    });

    it('links only the registering company (no cross-company association)', async () => {
      mockBuyerUser();

      await service.vendorOnboarding('user-1', { ...vendorDto, secondaryCategories: ['Steel'] });

      const createCall = prisma.companyCategory.createMany.mock.calls[0][0];
      expect(createCall.data.length).toBeGreaterThan(0);
      for (const row of createCall.data) {
        expect(row.companyId).toBe('company-1');
      }
    });

    it('applies fail-closed linking to buyer registration too (shared helper)', async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      prisma.user.create.mockResolvedValue({ ...mockUser, role: 'BUYER' });
      catalogClassifyService.resolveCategoryText.mockResolvedValue(null);

      await expect(
        service.registerBuyer({ ...buyerDto, primaryCategories: ['Zzz Not Real'] } as any),
      ).rejects.toThrow('Unknown business category: "Zzz Not Real"');

      expect(prisma.companyCategory.createMany).not.toHaveBeenCalled();
    });
  });


  describe('registerBuyer', () => {
    it('runs all persisted writes in a single transaction including newsletter', async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      prisma.user.create.mockResolvedValue({ id: 'user-1', email: 'buyer@example.com', name: 'Buyer', role: 'BUYER', permissions: [] });

      const result = await service.registerBuyer(buyerDto);

      expect(prisma.$transaction).toHaveBeenCalledWith(expect.any(Function));
      expect(prisma.company.create).toHaveBeenCalled();
      expect(prisma.companyOwner.create).toHaveBeenCalled();
      expect(prisma.companyLocation.create).toHaveBeenCalled();
      expect(notificationService.initializeDefaultPreferences).toHaveBeenCalledWith('company-1', 'user-1', prisma);
      expect(notificationService.upsertPreference).toHaveBeenCalledTimes(2);
      expect(prisma.newsletterSubscriber.upsert).toHaveBeenCalled();
      expect(emailQueue.add).toHaveBeenCalled();
      expect(result.companyId).toBe('company-1');
    });

    it('rolls back and skips all side effects when preference initialization fails', async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      prisma.user.create.mockResolvedValue({ id: 'user-1', email: 'buyer@example.com', name: 'Buyer', role: 'BUYER', permissions: [] });
      notificationService.initializeDefaultPreferences.mockRejectedValueOnce(new Error('pref failure'));

      await expect(service.registerBuyer(buyerDto)).rejects.toThrow('pref failure');

      expect(prisma.$transaction).toHaveBeenCalledWith(expect.any(Function));
      expect(prisma.newsletterSubscriber.upsert).not.toHaveBeenCalled();
      expect(prisma.session.create).not.toHaveBeenCalled();
      expect(emailQueue.add).not.toHaveBeenCalled();
    });

    it('skips newsletter when not requested', async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      prisma.user.create.mockResolvedValue({ id: 'user-1', email: 'buyer@example.com', name: 'Buyer', role: 'BUYER', permissions: [] });

      await service.registerBuyer({ ...buyerDto, newsletter: false });

      expect(prisma.newsletterSubscriber.upsert).not.toHaveBeenCalled();
      expect(emailQueue.add).toHaveBeenCalled();
    });
  });
});
