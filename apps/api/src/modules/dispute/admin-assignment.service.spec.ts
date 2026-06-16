import { Test, TestingModule } from '@nestjs/testing';
import { AdminAssignmentService } from './admin-assignment.service';
import { PrismaService } from '../../prisma/prisma.service';

describe('AdminAssignmentService', () => {
  let service: AdminAssignmentService;
  let prisma: any;

  const mockAdmins = [
    { id: 'a1', name: 'Admin One', email: 'a1@test.com', activeDisputeCount: 0 },
    { id: 'a2', name: 'Admin Two', email: 'a2@test.com', activeDisputeCount: 5 },
  ];

  beforeEach(async () => {
    prisma = {
      user: {
        findMany: jest.fn(),
      },
      dispute: {
        groupBy: jest.fn(),
      },
      disputeTimelineEvent: {
        create: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AdminAssignmentService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<AdminAssignmentService>(AdminAssignmentService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('assignArbitrator', () => {
    it('should assign the least busy admin', async () => {
      prisma.dispute.groupBy.mockResolvedValue([]);
      prisma.user.findMany.mockResolvedValue(mockAdmins);

      const result = await service.assignArbitrator('d1');
      expect(result.adminId).toBe('a1');
      expect(result.reason).toBe('least-active');
    });

    it('should throw if no admins available', async () => {
      prisma.dispute.groupBy.mockResolvedValue([]);
      prisma.user.findMany.mockResolvedValue([]);

      await expect(service.assignArbitrator('d1')).rejects.toThrow('No available admins');
    });
  });

  describe('getLeastBusyAdmin', () => {
    it('should return the admin with fewest active disputes', async () => {
      prisma.dispute.groupBy.mockResolvedValue([]);
      prisma.user.findMany.mockResolvedValue(mockAdmins);

      const result = await service.getLeastBusyAdmin();
      expect(result.id).toBe('a1');
    });

    it('should return null when no admins exist', async () => {
      prisma.dispute.groupBy.mockResolvedValue([]);
      prisma.user.findMany.mockResolvedValue([]);

      const result = await service.getLeastBusyAdmin();
      expect(result).toBeNull();
    });
  });
});
