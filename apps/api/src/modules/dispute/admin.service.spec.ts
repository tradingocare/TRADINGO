import { Test, TestingModule } from '@nestjs/testing';
import { AdminService } from './admin.service';
import { PrismaService } from '../../prisma/prisma.service';

describe('AdminService', () => {
  let service: AdminService;
  let prisma: any;

  beforeEach(async () => {
    prisma = {
      user: {
        findMany: jest.fn(),
      },
      dispute: {
        groupBy: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AdminService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<AdminService>(AdminService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getAvailableAdmins', () => {
    it('should return admins with dispute counts', async () => {
      prisma.dispute.groupBy.mockResolvedValue([
        { assignedAdminId: 'a1', _count: { id: 3 } },
      ]);
      prisma.user.findMany.mockResolvedValue([
        { id: 'a1', name: 'Admin One', email: 'admin1@test.com' },
        { id: 'a2', name: 'Admin Two', email: 'admin2@test.com' },
      ]);

      const admins = await service.getAvailableAdmins();
      expect(admins).toHaveLength(2);
      expect(admins[0].activeDisputeCount).toBe(3);
      expect(admins[1].activeDisputeCount).toBe(0);
    });
  });

  describe('getLeastBusyAdmin', () => {
    it('should return the admin with fewest disputes', async () => {
      prisma.dispute.groupBy.mockResolvedValue([]);
      prisma.user.findMany.mockResolvedValue([
        { id: 'a1', name: 'Busy Admin', email: 'busy@test.com' },
        { id: 'a2', name: 'Free Admin', email: 'free@test.com' },
      ]);

      const admin = await service.getLeastBusyAdmin();
      expect(admin).toBeDefined();
      expect(admin.activeDisputeCount).toBe(0);
    });

    it('should return null if no admins', async () => {
      prisma.dispute.groupBy.mockResolvedValue([]);
      prisma.user.findMany.mockResolvedValue([]);

      const admin = await service.getLeastBusyAdmin();
      expect(admin).toBeNull();
    });
  });
});
