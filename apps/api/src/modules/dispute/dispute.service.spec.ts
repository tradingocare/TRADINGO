import { Test, TestingModule } from '@nestjs/testing';
import { DisputeService } from './dispute.service';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificationService } from '../notification/notification.service';
import { DisputeAnalyticsService } from './dispute-analytics.service';
import { AdminAssignmentService } from './admin-assignment.service';
import { getQueueToken } from '@nestjs/bullmq';

describe('DisputeService', () => {
  let service: DisputeService;
  let prisma: any;
  let notificationService: any;
  let disputeAnalyticsService: any;
  let adminAssignmentService: any;
  let disputeQueue: any;

  const mockDispute = {
    id: 'd1',
    disputeNumber: 'DSP-123-4567',
    orderId: 'o1',
    escrowId: 'e1',
    raisedByCompanyId: 'c1',
    againstCompanyId: 'c2',
    type: 'PRODUCT',
    reason: 'QUALITY_ISSUE',
    status: 'ESCALATED',
    description: 'Test dispute',
    amount: 1000,
    createdBy: 'u1',
    updatedBy: 'u1',
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
    assignedAdminId: null,
    assignedAt: null,
    arbitrationDueAt: null,
    assignmentReason: null,
  };

  beforeEach(async () => {
    prisma = {
      dispute: {
        findUnique: jest.fn(),
        findMany: jest.fn(),
        count: jest.fn(),
        update: jest.fn(),
      },
      order: {
        findUnique: jest.fn(),
      },
      escrow: {
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      company: {
        update: jest.fn(),
      },
      orderNumberCounter: {
        upsert: jest.fn(),
      },
      disputeTimelineEvent: {
        create: jest.fn(),
      },
      disputeProcessorExecution: {
        findUnique: jest.fn(),
        create: jest.fn(),
      },
      disputeMessage: {
        create: jest.fn(),
      },
      disputeEvidence: {
        create: jest.fn(),
      },
      disputeResolution: {
        create: jest.fn(),
      },
      disputeAppeal: {
        create: jest.fn(),
        update: jest.fn(),
      },
      $transaction: jest.fn(),
    };

    notificationService = {
      createWithTemplate: jest.fn(),
    };

    disputeAnalyticsService = {
      trackEvent: jest.fn(),
      getDisputeMetrics: jest.fn(),
    };

    adminAssignmentService = {
      assignArbitrator: jest.fn(),
    };

    disputeQueue = {
      add: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DisputeService,
        { provide: PrismaService, useValue: prisma },
        { provide: NotificationService, useValue: notificationService },
        { provide: DisputeAnalyticsService, useValue: disputeAnalyticsService },
        { provide: AdminAssignmentService, useValue: adminAssignmentService },
        { provide: getQueueToken('dispute'), useValue: disputeQueue },
      ],
    }).compile();

    service = module.get<DisputeService>(DisputeService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('adminArbitration', () => {
    it('should throw NotFoundException if dispute not found', async () => {
      prisma.dispute.findUnique.mockResolvedValue(null);
      await expect(service.adminArbitration('nonexistent')).rejects.toThrow();
    });

    it('should return early if dispute is not ESCALATED', async () => {
      prisma.dispute.findUnique.mockResolvedValue({ ...mockDispute, status: 'OPEN' });
      await service.adminArbitration('d1');
      expect(prisma.$transaction).not.toHaveBeenCalled();
    });

    it('should be idempotent if job already processed', async () => {
      prisma.dispute.findUnique.mockResolvedValue({ ...mockDispute, status: 'ESCALATED' });
      prisma.disputeProcessorExecution.findUnique.mockResolvedValue({ id: 'existing', jobId: 'j1' });
      adminAssignmentService.assignArbitrator.mockResolvedValue({ adminId: 'a1', reason: 'round-robin' });

      await service.adminArbitration('d1', 'j1');
      expect(prisma.$transaction).not.toHaveBeenCalled();
    });

    it('should assign admin and update dispute status', async () => {
      const mockEscrow = { id: 'e1', orderId: 'o1', status: 'DISPUTED', amount: 1000 };
      prisma.dispute.findUnique.mockResolvedValue({ ...mockDispute, escrow: mockEscrow });
      adminAssignmentService.assignArbitrator.mockResolvedValue({ adminId: 'a1', reason: 'round-robin' });
      prisma.disputeProcessorExecution.findUnique.mockResolvedValue(null);
      prisma.$transaction.mockImplementation(async (cb: any) => cb(prisma));

      await service.adminArbitration('d1', 'j1');

      expect(adminAssignmentService.assignArbitrator).toHaveBeenCalledWith('d1');
      expect(prisma.$transaction).toHaveBeenCalled();
    });
  });

  describe('handleArbitrationSlaBreach', () => {
    it('should throw NotFoundException if dispute not found', async () => {
      prisma.dispute.findUnique.mockResolvedValue(null);
      await expect(service.handleArbitrationSlaBreach('nonexistent')).rejects.toThrow();
    });

    it('should return early if dispute is not ADMIN_ARBITRATION', async () => {
      prisma.dispute.findUnique.mockResolvedValue({ ...mockDispute, status: 'OPEN' });
      await service.handleArbitrationSlaBreach('d1');
      expect(prisma.$transaction).not.toHaveBeenCalled();
    });

    it('should escalate and create timeline event', async () => {
      prisma.dispute.findUnique.mockResolvedValue({ ...mockDispute, status: 'ADMIN_ARBITRATION' });
      prisma.$transaction.mockImplementation(async (cb: any) => cb(prisma));

      await service.handleArbitrationSlaBreach('d1');

      expect(prisma.$transaction).toHaveBeenCalled();
    });
  });

  describe('processExpiredDisputes', () => {
    it('should process expired disputes', async () => {
      prisma.dispute.findMany.mockResolvedValue([mockDispute]);
      prisma.$transaction.mockImplementation(async (cb: any) => cb(prisma));

      const result = await service.processExpiredDisputes();
      expect(result.processed).toBe(1);
      expect(result.expired).toBe(1);
    });
  });
});
