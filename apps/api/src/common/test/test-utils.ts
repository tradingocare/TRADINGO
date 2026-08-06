export type DeepMockProxy<T> = {
  [K in keyof T]: T[K] extends (...args: infer A) => infer R
    ? jest.MockedFunction<(...args: A) => R>
    : DeepMockProxy<T[K]>;
};

export function createMockPrisma() {
  return {
    $transaction: jest.fn((arg: any) => {
      if (typeof arg === 'function') return arg(createMockTx());
      if (Array.isArray(arg)) return Promise.all(arg.map((op: any) => op(createMockTx())));
      return Promise.resolve([]);
    }),
    $queryRaw: jest.fn().mockResolvedValue([]),
    $queryRawUnsafe: jest.fn().mockResolvedValue([]),
    $executeRaw: jest.fn().mockResolvedValue(1),
    $executeRawUnsafe: jest.fn().mockResolvedValue(1),
    $connect: jest.fn(),
    $disconnect: jest.fn(),
    user: { findUnique: jest.fn(), findFirst: jest.fn(), findMany: jest.fn(), create: jest.fn(), update: jest.fn(), delete: jest.fn(), count: jest.fn() },
    company: { findUnique: jest.fn(), findFirst: jest.fn(), findMany: jest.fn(), create: jest.fn(), update: jest.fn(), delete: jest.fn(), count: jest.fn() },
    session: { findUnique: jest.fn(), findFirst: jest.fn(), findMany: jest.fn(), create: jest.fn(), update: jest.fn(), delete: jest.fn(), updateMany: jest.fn(), count: jest.fn() },
    order: { findUnique: jest.fn(), findFirst: jest.fn(), findMany: jest.fn(), create: jest.fn(), update: jest.fn(), delete: jest.fn(), count: jest.fn(), aggregate: jest.fn() },
    orderItem: { create: jest.fn(), findMany: jest.fn(), updateMany: jest.fn(), aggregate: jest.fn() },
    payment: { findUnique: jest.fn(), findFirst: jest.fn(), findMany: jest.fn(), create: jest.fn(), update: jest.fn(), updateMany: jest.fn(), count: jest.fn(), aggregate: jest.fn() },
    escrow: { findUnique: jest.fn(), findFirst: jest.fn(), findMany: jest.fn(), create: jest.fn(), update: jest.fn(), count: jest.fn(), aggregate: jest.fn() },
    escrowEvent: { create: jest.fn(), findMany: jest.fn() },
    gOCASH_Wallet: { findUnique: jest.fn(), findFirst: jest.fn(), findMany: jest.fn(), create: jest.fn(), update: jest.fn(), count: jest.fn(), aggregate: jest.fn() },
    gOCASH_Transaction: { findUnique: jest.fn(), findFirst: jest.fn(), findMany: jest.fn(), create: jest.fn(), count: jest.fn() },
    gOCASH_Redemption: { findUnique: jest.fn(), findFirst: jest.fn(), findMany: jest.fn(), create: jest.fn(), update: jest.fn(), count: jest.fn() },
    commission: { findUnique: jest.fn(), findFirst: jest.fn(), findMany: jest.fn(), create: jest.fn(), update: jest.fn(), delete: jest.fn(), count: jest.fn() },
    commissionRule: { findMany: jest.fn(), findFirst: jest.fn(), create: jest.fn(), update: jest.fn(), delete: jest.fn() },
    settlement: { findUnique: jest.fn(), findFirst: jest.fn(), findMany: jest.fn(), create: jest.fn(), update: jest.fn(), count: jest.fn() },
    refund: { create: jest.fn(), findMany: jest.fn(), aggregate: jest.fn(), count: jest.fn(), updateMany: jest.fn() },
    dispute: { findUnique: jest.fn(), findFirst: jest.fn(), findMany: jest.fn(), create: jest.fn(), update: jest.fn(), count: jest.fn() },
    referralCode: { findUnique: jest.fn(), findFirst: jest.fn(), findMany: jest.fn(), create: jest.fn(), update: jest.fn(), delete: jest.fn(), count: jest.fn() },
    referralUsage: { findUnique: jest.fn(), findFirst: jest.fn(), findMany: jest.fn(), create: jest.fn(), update: jest.fn(), count: jest.fn() },
    referralReward: { findUnique: jest.fn(), findFirst: jest.fn(), findMany: jest.fn(), create: jest.fn(), count: jest.fn(), aggregate: jest.fn() },
    referralAudit: { create: jest.fn(), findMany: jest.fn(), count: jest.fn() },
    referralBlacklist: { findUnique: jest.fn(), findFirst: jest.fn(), findMany: jest.fn(), create: jest.fn(), delete: jest.fn() },
    referralRule: { findMany: jest.fn(), findFirst: jest.fn() },
    campaign: { findUnique: jest.fn(), findFirst: jest.fn(), findMany: jest.fn(), create: jest.fn(), update: jest.fn(), delete: jest.fn(), count: jest.fn() },
    campaignRule: { create: jest.fn(), findMany: jest.fn() },
    campaignTarget: { create: jest.fn(), findMany: jest.fn() },
    campaignClaim: { findUnique: jest.fn(), findFirst: jest.fn(), findMany: jest.fn(), create: jest.fn(), update: jest.fn(), deleteMany: jest.fn(), count: jest.fn(), aggregate: jest.fn() },
    campaignAnalytics: { findUnique: jest.fn(), upsert: jest.fn(), findMany: jest.fn() },
    membership: { findUnique: jest.fn(), findFirst: jest.fn(), findMany: jest.fn(), create: jest.fn(), update: jest.fn(), count: jest.fn() },
    plan: { findUnique: jest.fn(), findFirst: jest.fn(), findMany: jest.fn() },
    membershipPlan: { findUnique: jest.fn(), findFirst: jest.fn(), findMany: jest.fn(), create: jest.fn(), update: jest.fn(), delete: jest.fn(), count: jest.fn() },
    planFeature: { findMany: jest.fn(), create: jest.fn(), createMany: jest.fn(), deleteMany: jest.fn(), orderBy: jest.fn() },
    planHistory: { create: jest.fn(), findMany: jest.fn(), count: jest.fn() },
    planAddon: { findMany: jest.fn(), create: jest.fn(), delete: jest.fn(), count: jest.fn() },
    planAuditLog: { create: jest.fn(), findMany: jest.fn(), count: jest.fn() },
    subscriptionEvent: { create: jest.fn(), findMany: jest.fn(), count: jest.fn() },
    coupon: { findUnique: jest.fn(), findFirst: jest.fn(), findMany: jest.fn(), create: jest.fn(), update: jest.fn(), count: jest.fn() },
    couponRedemption: { findFirst: jest.fn(), findMany: jest.fn(), create: jest.fn(), count: jest.fn() },
    referral: { findUnique: jest.fn(), findFirst: jest.fn(), findMany: jest.fn(), create: jest.fn(), update: jest.fn(), count: jest.fn() },
    appSetting: { findUnique: jest.fn(), upsert: jest.fn(), create: jest.fn(), update: jest.fn() },
    invoice: { findUnique: jest.fn(), findFirst: jest.fn(), findMany: jest.fn(), create: jest.fn(), update: jest.fn(), count: jest.fn() },
    professionalService: { findUnique: jest.fn(), findFirst: jest.fn(), findMany: jest.fn(), create: jest.fn(), update: jest.fn(), delete: jest.fn(), count: jest.fn() },
    professionalCertification: { findUnique: jest.fn(), findFirst: jest.fn(), findMany: jest.fn(), create: jest.fn(), update: jest.fn(), delete: jest.fn() },
    professionalPortfolio: { findUnique: jest.fn(), findFirst: jest.fn(), findMany: jest.fn(), create: jest.fn(), update: jest.fn(), delete: jest.fn() },
    professionalAvailability: { findMany: jest.fn(), findFirst: jest.fn(), create: jest.fn(), upsert: jest.fn(), deleteMany: jest.fn() },
    professionalLanguage: { findMany: jest.fn(), findFirst: jest.fn(), create: jest.fn(), upsert: jest.fn(), delete: jest.fn() },
    professionalServiceArea: { findMany: jest.fn(), findFirst: jest.fn(), create: jest.fn(), delete: jest.fn() },
    companyOwner: { findMany: jest.fn(), findFirst: jest.fn(), create: jest.fn(), deleteMany: jest.fn() },
    booking: { findUnique: jest.fn(), findFirst: jest.fn(), findMany: jest.fn(), create: jest.fn(), update: jest.fn(), count: jest.fn() },
    professionalReview: { findUnique: jest.fn(), findFirst: jest.fn(), findMany: jest.fn(), create: jest.fn(), count: jest.fn(), aggregate: jest.fn() },
    proposal: { findUnique: jest.fn(), findFirst: jest.fn(), findMany: jest.fn(), create: jest.fn(), update: jest.fn(), delete: jest.fn(), count: jest.fn() },
    notification: { findUnique: jest.fn(), findFirst: jest.fn(), findMany: jest.fn(), create: jest.fn(), update: jest.fn(), updateMany: jest.fn(), delete: jest.fn(), count: jest.fn() },
    notificationDelivery: { findUnique: jest.fn(), findFirst: jest.fn(), findMany: jest.fn(), create: jest.fn(), update: jest.fn(), updateMany: jest.fn(), count: jest.fn() },
    notificationPreference: { findUnique: jest.fn(), findFirst: jest.fn(), findMany: jest.fn(), create: jest.fn(), update: jest.fn(), upsert: jest.fn(), createMany: jest.fn(), count: jest.fn() },
    notificationTemplate: { findUnique: jest.fn(), findFirst: jest.fn(), findMany: jest.fn(), update: jest.fn() },
    auditLog: { create: jest.fn(), findMany: jest.fn() },
    eventLog: { create: jest.fn(), findMany: jest.fn() },
  };
}

export function createMockTx() {
  return {
    gOCASH_Wallet: { findUnique: jest.fn(), update: jest.fn() },
    gOCASH_Transaction: { findUnique: jest.fn(), findFirst: jest.fn(), findMany: jest.fn(), create: jest.fn(), count: jest.fn() },
    gOCASH_Redemption: { findUnique: jest.fn(), update: jest.fn() },
    order: { findUnique: jest.fn() },
    escrow: { findUnique: jest.fn(), create: jest.fn(), update: jest.fn() },
    escrowEvent: { create: jest.fn() },
  };
}

export function createMockRedis() {
  return {
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
    incr: jest.fn(),
    expire: jest.fn(),
    exists: jest.fn(),
    ttl: jest.fn(),
  };
}

export function createMockJwt() {
  return {
    sign: jest.fn().mockReturnValue('mock-token'),
    verify: jest.fn().mockReturnValue({ sub: 'user-1', role: 'BUYER' }),
    decode: jest.fn(),
  };
}

export function createMockQueue() {
  return {
    add: jest.fn().mockResolvedValue({ id: 'mock-job-id' }),
    getJob: jest.fn(),
    getJobs: jest.fn(),
    getActive: jest.fn(),
    getWaiting: jest.fn(),
    getCompleted: jest.fn(),
    getFailed: jest.fn(),
    obliterate: jest.fn(),
    remove: jest.fn(),
  };
}

export function createMockNotificationService() {
  return {
    createWithTemplate: jest.fn().mockResolvedValue({ id: 'notification-1' }),
    send: jest.fn(),
    create: jest.fn(),
  };
}

export function createMockAnalyticsService() {
  return {
    trackEvent: jest.fn().mockResolvedValue(undefined),
    getEscrowMetrics: jest.fn().mockResolvedValue({ totalEscrows: 0, heldCount: 0, releasedCount: 0 }),
  };
}

export function createMockCommissionService() {
  return {
    calculate: jest.fn().mockResolvedValue({
      grossAmount: 10000,
      commissionType: 'PERCENTAGE',
      commissionValue: 5,
      platformCommission: 500,
      netSettlementAmount: 9500,
      tdsAmount: 100,
      gstAmount: 90,
      netAmount: 9310,
      appliedRule: { id: 'default', name: 'Platform Default', calcType: 'PERCENTAGE', value: 5 },
      ruleSource: 'platform_default',
      calculationTimestamp: new Date(),
    }),
  };
}

export function createMockSettlementService() {
  return {
    create: jest.fn().mockResolvedValue({ id: 'settlement-1', status: 'PENDING' }),
  };
}

export const mockWallet = {
  id: 'wallet-1',
  userId: 'user-1',
  companyId: 'company-1',
  type: 'BUYER',
  currentBalance: 1000,
  availableBalance: 1000,
  pendingBalance: 0,
  lockedBalance: 0,
  expiredBalance: 0,
  lifetimeEarned: 5000,
  lifetimeRedeemed: 4000,
  lifetimeExpired: 0,
  kycVerified: true,
  status: 'ACTIVE',
  version: 1,
  createdAt: new Date('2026-01-01'),
  updatedAt: new Date('2026-06-01'),
};

export const mockTransaction = {
  id: 'tx-1',
  walletId: 'wallet-1',
  direction: 'CREDIT',
  status: 'SUCCESS',
  type: 'CAMPAIGN_REWARD',
  amount: 500,
  balanceBefore: 500,
  balanceAfter: 1000,
  currency: 'GOCASH',
  reason: 'Campaign reward',
  referenceId: 'campaign-1',
  referenceType: 'CAMPAIGN',
  sourceType: null,
  sourceSystem: null,
  actorId: 'user-1',
  actorType: 'USER',
  idempotencyKey: null,
  notes: null,
  createdAt: new Date('2026-06-01'),
};

export const mockRedemption = {
  id: 'redemption-1',
  walletId: 'wallet-1',
  amount: 500,
  redemptionType: 'BANK_TRANSFER',
  status: 'PENDING',
  reference: null,
  redeemedAt: new Date('2026-06-01'),
  approvedAt: null,
  approvedBy: null,
  rejectedAt: null,
  rejectionReason: null,
  createdAt: new Date('2026-06-01'),
  wallet: mockWallet,
};
