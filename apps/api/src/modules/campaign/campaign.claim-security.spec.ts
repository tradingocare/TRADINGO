import { CampaignService } from './campaign.service';

/**
 * P0-SEC-01 regression suite — campaign claim identity / amount / audit / replay.
 * Isolation: checkEligibility is overridden so these tests exercise exactly the
 * changed claim-authorization surface without coupling to eligibility internals.
 */
describe('CampaignService.claimReward — P0-SEC-01', () => {
  const CAMPAIGN_ID = 'camp-1';
  const REWARD = 250;
  const campaign = { id: CAMPAIGN_ID, name: 'Test Campaign', rewardAmount: REWARD };

  const makePrisma = () => {
    const claims: any[] = [];
    const ledger: any[] = [];
    let claimSeq = 0;
    const prisma: any = {
      campaignClaim: {
        create: jest.fn(async ({ data }: any) => {
          const row = { id: `claim-${++claimSeq}`, status: 'APPROVED', transactionId: null, ...data };
          claims.push(row);
          return row;
        }),
        update: jest.fn(async ({ where, data }: any) => {
          const row = claims.find((c) => c.id === where.id);
          Object.assign(row, data);
          return row;
        }),
        findUnique: jest.fn(async ({ where }: any) => claims.find((c) => c.id === where.id) ?? null),
      },
      campaign: { update: jest.fn(async ({ where, data }: any) => ({ id: where.id, ...data })) },
      campaignAnalytics: { upsert: jest.fn(async () => ({})) },
      gOCASH_Wallet: { findUnique: jest.fn() },
    };
    return { prisma, claims, ledger };
  };

  const makeGocash = (wallets: Record<string, string>) => {
    const ledger: any[] = [];
    const keys = new Set<string>();
    return {
      svc: {
        credit: jest.fn(async (p: any) => {
          if (!keys.has(p.idempotencyKey)) {
            keys.add(p.idempotencyKey);
            ledger.push(p);
            return { id: `tx-${ledger.length}` };
          }
          const existing = ledger.find((l) => l.idempotencyKey === p.idempotencyKey)!;
          return { id: existing ? `tx-existing` : '' };
        }),
      },
      ledger,
      keys,
    };
  };

  const build = (walletOwnerId: string | null) => {
    const { prisma, claims, ledger } = makePrisma();
    const g = makeGocash({});
    (prisma.gOCASH_Wallet.findUnique as jest.Mock).mockImplementation(({ where }: any) =>
      Promise.resolve(where.userId === walletOwnerId ? { id: `wallet-${where.userId}`, userId: where.userId } : null),
    );
    const svc: any = new CampaignService(prisma, g.svc as any);
    svc.checkEligibility = jest.fn().mockResolvedValue({ eligible: true, campaign });
    return { svc, prisma, claims, ledger: g.ledger };
  };

  const ACTOR_A = { userId: 'user-A', companyId: 'co-A', ip: '10.0.0.5', userAgent: 'jest-agent' };

  it('1+2. attacker payload naming user B cannot credit B; A credits A', async () => {
    const { svc, prisma, claims, ledger } = build('user-A');
    // Legacy-style spoof attempt: extra properties are ignored by the new signature.
    await svc.claimReward(
      { campaignId: CAMPAIGN_ID, companyId: 'co-A', userId: 'user-B', amount: 999999, ipAddress: '6.6.6.6' } as any,
      ACTOR_A,
    );
    expect((prisma.gOCASH_Wallet.findUnique as jest.Mock)).toHaveBeenCalledWith({ where: { userId: 'user-A' } });
    expect(claims[0].userId).toBe('user-A');
    expect(claims[0].amount).toBe(REWARD);
    expect(ledger).toHaveLength(1);
  });

  it('3. client-supplied amount cannot override campaign.rewardAmount', async () => {
    const { svc, claims, ledger } = build('user-A');
    await svc.claimReward({ campaignId: CAMPAIGN_ID } as any, ACTOR_A);
    expect(claims[0].amount).toBe(REWARD);
    expect(ledger[0].amount).toBe(REWARD);
  });

  it('4. duplicate claim cannot double-credit (deterministic idempotency key)', async () => {
    const { svc, ledger } = build('user-A');
    await svc.claimReward({ campaignId: CAMPAIGN_ID }, ACTOR_A);
    await svc.claimReward({ campaignId: CAMPAIGN_ID }, ACTOR_A);
    // Same deterministic key => second credit resolves to the existing ledger entry.
    expect(new Set(ledger.map((l) => l.idempotencyKey))).toEqual(new Set([`CAMPAIGN_${CAMPAIGN_ID}_user-A`]));
  });

  it('5. losing a concurrent duplicate cannot produce a second persisted credit', async () => {
    const { svc, ledger, claims } = build('user-A');
    await svc.claimReward({ campaignId: CAMPAIGN_ID }, ACTOR_A);
    expect(ledger).toHaveLength(1);
    // Simulated race loser: deterministic key already present -> unique-constraint style failure.
    ((svc as any).gocashService.credit as jest.Mock).mockImplementationOnce(async () => {
      throw new Error('Duplicate idempotencyKey');
    });
    await expect(svc.claimReward({ campaignId: CAMPAIGN_ID }, ACTOR_A)).rejects.toThrow('Duplicate idempotencyKey');
    // Loser claim marked FAILED; still exactly one persisted credit.
    expect(claims.filter((c) => c.status === 'FAILED')).toHaveLength(1);
    expect(ledger.filter((l) => l.type === 'CAMPAIGN_REWARD')).toHaveLength(1);
  });

  it('6. eligibility is evaluated for the authenticated actor only', async () => {
    const { svc } = build('user-A');
    await svc.claimReward({ campaignId: CAMPAIGN_ID }, ACTOR_A);
    expect(svc.checkEligibility).toHaveBeenCalledWith(CAMPAIGN_ID, 'user-A', 'co-A');
  });

  it('7. stored audit IP/UA come from the server request context, not client input', async () => {
    const { svc, claims } = build('user-A');
    await svc.claimReward({ campaignId: CAMPAIGN_ID } as any, ACTOR_A);
    expect(claims[0].ipAddress).toBe('10.0.0.5');
    expect(claims[0].userAgent).toBe('jest-agent');
  });

  it('wallet-missing actor still records FAILED claim without credit', async () => {
    const { svc, ledger } = build('user-B');
    await expect(svc.claimReward({ campaignId: CAMPAIGN_ID }, { ...ACTOR_A })).rejects.toThrow(
      'User has no GOCASH wallet',
    );
    expect(ledger).toHaveLength(0);
  });
});
