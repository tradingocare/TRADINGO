import { TradeservService } from './tradeserv.service';

/**
 * P0-SEC-02 regression suite — booking status authorization (IDOR closure).
 * Instantiates the real service via prototype and injects only the
 * collaborators touched by updateBookingStatus().
 */
describe('TradeservService.updateBookingStatus — P0-SEC-02', () => {
  const PRO_CO = 'pro-co';
  const CLIENT_CO = 'client-co';

  const bookingBase = (over: Record<string, unknown> = {}) => ({
    id: 'b1',
    status: 'PENDING',
    companyId: PRO_CO,
    clientId: CLIENT_CO,
    paymentStatus: 'PAID',
    amount: { toNumber: () => 5000 },
    scheduledAt: new Date('2027-01-01T10:00:00Z'),
    ...over,
  });

  const OWNERS: Record<string, string[]> = {
    'PRO-USER': [PRO_CO],
    'CLIENT-USER': [CLIENT_CO],
  };
  const ROLES: Record<string, string> = {
    'PRO-USER': 'SELLER',
    'CLIENT-USER': 'BUYER',
    STRANGER: 'BUYER',
    MANAGER: 'MANAGER',
    ADMIN: 'ADMIN',
    SUPER: 'SUPER_ADMIN',
  };

  const build = (booking: ReturnType<typeof bookingBase>) => {
    const prisma: any = {
      booking: {
        findUnique: jest.fn(async () => ({ ...booking })),
        update: jest.fn(async ({ data }: any) => ({ ...booking, id: booking.id, ...data })),
      },
      companyOwner: {
        findFirst: jest.fn(async ({ where }: any) =>
          (OWNERS[where.userId] ?? []).includes(where.companyId) &&
          !(where.company && where.company.deletedAt !== undefined && false)
            ? { id: 'link' }
            : null,
        ),
      },
      user: { findUnique: jest.fn(async ({ where }: any) => ({ role: ROLES[where.id] ?? 'VIEWER' })) },
      auditLog: { create: jest.fn(async () => ({})) },
    };
    const svc: any = Object.create(TradeservService.prototype);
    svc.prisma = prisma;
    svc.logger = { warn: jest.fn(), log: jest.fn(), error: jest.fn() };
    svc.notificationService = { createWithTemplate: jest.fn().mockResolvedValue({}) };
    svc.financialOrchestrator = { processBookingCompleted: jest.fn().mockResolvedValue({}) };
    svc.awardBookingCompletionReward = jest.fn();
    return { svc, prisma };
  };

  it('8. stranger -> 403 and zero write', async () => {
    const { svc, prisma } = build(bookingBase());
    await expect(svc.updateBookingStatus('b1', 'STRANGER', { status: 'CANCELLED' })).rejects.toMatchObject({
      status: 403,
    });
    expect(prisma.booking.update).not.toHaveBeenCalled();
    expect(svc.awardBookingCompletionReward).not.toHaveBeenCalled();
    expect(svc.financialOrchestrator.processBookingCompleted).not.toHaveBeenCalled();
  });

  it('9. client owns booking.clientId -> legal cancel allowed', async () => {
    const { svc, prisma } = build(bookingBase());
    const r = await svc.updateBookingStatus('b1', 'CLIENT-USER', { status: 'CANCELLED', cancelReason: 'sched' });
    expect(r.status).toBe('CANCELLED');
    expect(prisma.booking.update).toHaveBeenCalledTimes(1);
  });

  it('10. client cannot perform professional-only transition (PENDING->CONFIRMED) -> 403', async () => {
    const { svc, prisma } = build(bookingBase());
    await expect(svc.updateBookingStatus('b1', 'CLIENT-USER', { status: 'CONFIRMED' })).rejects.toMatchObject({
      status: 403,
    });
    expect(prisma.booking.update).not.toHaveBeenCalled();
  });

  it('11. professional owner -> full legal lifecycle PENDING->CONFIRMED->IN_PROGRESS->COMPLETED', async () => {
    let b = bookingBase();
    const { svc, prisma } = build(b);
    (prisma.booking.findUnique as jest.Mock).mockImplementation(() => Promise.resolve({ ...b }));
    (prisma.booking.update as jest.Mock).mockImplementation(({ data }: any) => {
      b = { ...b, ...data };
      return Promise.resolve({ ...b });
    });
    await svc.updateBookingStatus('b1', 'PRO-USER', { status: 'CONFIRMED' });
    await svc.updateBookingStatus('b1', 'PRO-USER', { status: 'IN_PROGRESS' });
    await svc.updateBookingStatus('b1', 'PRO-USER', { status: 'COMPLETED' });
    expect(b.status).toBe('COMPLETED');
    expect(svc.awardBookingCompletionReward).toHaveBeenCalledTimes(1);
    expect(svc.financialOrchestrator.processBookingCompleted).toHaveBeenCalledTimes(1);
  });

  it('12. unrelated professional owner -> 403', async () => {
    const { svc } = build(bookingBase());
    await expect(svc.updateBookingStatus('b1', 'OTHER-PRO', { status: 'CONFIRMED' })).rejects.toMatchObject({
      status: 403,
    });
  });

  it('13. admin/superadmin legal transitions OK; manager/viewer -> 403', async () => {
    const a = build(bookingBase());
    await expect(a.svc.updateBookingStatus('b1', 'ADMIN', { status: 'CONFIRMED' })).resolves.toMatchObject({
      status: 'CONFIRMED',
    });
    const s = build(bookingBase({ status: 'IN_PROGRESS' }));
    await expect(s.svc.updateBookingStatus('b1', 'SUPER', { status: 'COMPLETED' })).resolves.toMatchObject({
      status: 'COMPLETED',
    });
    const m = build(bookingBase());
    await expect(m.svc.updateBookingStatus('b1', 'MANAGER', { status: 'CANCELLED' })).rejects.toMatchObject({
      status: 403,
    });
  });

  it('14. invalid state transition remains 400 for an authorized actor', async () => {
    const { svc } = build(bookingBase({ status: 'COMPLETED' }));
    await expect(svc.updateBookingStatus('b1', 'PRO-USER', { status: 'PENDING' })).rejects.toMatchObject({
      status: 400,
    });
  });

  it('15. unpaid confirmation still blocked by payment gate (400)', async () => {
    const { svc } = build(bookingBase({ paymentStatus: 'PENDING' }));
    await expect(svc.updateBookingStatus('b1', 'PRO-USER', { status: 'CONFIRMED' })).rejects.toMatchObject({
      status: 400,
    });
  });

  it('16. authorized completion triggers reward + settlement exactly once each', async () => {
    const { svc } = build(bookingBase({ status: 'IN_PROGRESS' }));
    await svc.updateBookingStatus('b1', 'PRO-USER', { status: 'COMPLETED' });
    expect(svc.awardBookingCompletionReward).toHaveBeenCalledTimes(1);
    expect(svc.financialOrchestrator.processBookingCompleted).toHaveBeenCalledTimes(1);
    expect(svc.financialOrchestrator.processBookingCompleted).toHaveBeenCalledWith('b1', 'PRO-USER');
  });
});
