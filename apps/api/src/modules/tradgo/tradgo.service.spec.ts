import { Test, TestingModule } from '@nestjs/testing';
import { TradgoService } from './tradgo.service';
import { PrismaService } from '../../prisma/prisma.service';

describe('TradgoService', () => {
  let service: TradgoService;
  let prisma: PrismaService;

  const mockPrisma = {
    company: {
      count: jest.fn().mockResolvedValue(100),
      findUnique: jest.fn().mockResolvedValue({
        verificationLevel: 'LEVEL_2',
        totalProducts: 25,
        trustScore: 85,
        createdAt: new Date('2023-01-01'),
      }),
      findMany: jest.fn().mockResolvedValue([
        { id: 'c1', name: 'Company A', slug: 'co-a', logo: null, trustScore: 92, totalProducts: 45, verificationLevel: 'LEVEL_3' },
        { id: 'c2', name: 'Company B', slug: 'co-b', logo: null, trustScore: 88, totalProducts: 30, verificationLevel: 'LEVEL_2' },
      ]),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [TradgoService, { provide: PrismaService, useValue: mockPrisma }],
    }).compile();

    service = module.get<TradgoService>(TradgoService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('should return races', async () => {
    const races = await service.getRaces();
    expect(races).toHaveLength(3);
    expect(races[0].status).toBe('completed');
    expect(races[1].status).toBe('active');
    expect(races[2].status).toBe('upcoming');
  });

  it('should return badges for a company', async () => {
    const badges = await service.getBadges('company-1');
    expect(badges.length).toBeGreaterThanOrEqual(4);
    expect(badges.some((b) => b.id === 'verified')).toBe(true);
    expect(badges.some((b) => b.id === 'trusted')).toBe(true);
    expect(badges.some((b) => b.id === 'catalog-builder')).toBe(true);
    expect(badges.some((b) => b.id === 'high-trust')).toBe(true);
  });

  it('should return empty badges when no companyId', async () => {
    const badges = await service.getBadges();
    expect(badges).toEqual([]);
  });

  it('should return leaderboard', async () => {
    const board = await service.getLeaderboard(10);
    expect(board).toHaveLength(2);
    expect(board[0].rank).toBe(1);
    expect(board[0].companyName).toBe('Company A');
    expect(board[0].score).toBeDefined();
  });
});
