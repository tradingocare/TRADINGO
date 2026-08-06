import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { TradeservService } from './tradeserv.service';
import { PrismaService } from '../../prisma/prisma.service';
import { CatalogAdapterService } from '../catalog-adapter/catalog-adapter.service';
import { NotificationService } from '../notification/notification.service';
import { RazorpayService } from '../payment/gateways/razorpay.service';
import { GocashIntegrationService } from '../gocash-integration/gocash-integration.service';
import { BookingFinancialOrchestratorService } from './booking-financial-orchestrator.service';
import { createMockPrisma } from '../../common/test/test-utils';

describe('TradeservService', () => {
  let service: TradeservService;
  let prisma: ReturnType<typeof createMockPrisma>;

  const mockCompany = {
    id: 'company-1',
    name: 'Test Professional',
    slug: 'test-professional',
    professionalType: 'CHARTERED_ACCOUNTANT',
    professionalStatus: 'APPROVED',
    trustScore: 85,
    logo: '/logo.png',
    about: 'Expert CA services',
    experience: 10,
    rating: 4.5,
    reviewCount: 25,
    professionalServices: [
      { id: 'svc-1', name: 'Tax Filing', description: 'Annual tax filing', price: 5000, isActive: true, sortOrder: 1 },
    ],
    professionalPortfolio: [{ id: 'port-1', title: 'Project Alpha', description: 'Completed tax filing for XYZ Corp' }],
    professionalCertifications: [{ id: 'cert-1', name: 'CPA', issuer: 'AICPA', issueDate: new Date('2020-01-01') }],
    professionalAvailability: [{ id: 'avail-1', dayOfWeek: 1, startTime: '09:00', endTime: '17:00' }],
    professionalLanguages: [{ id: 'lang-1', language: 'English', proficiency: 'NATIVE' }],
    professionalServiceAreas: [{ id: 'area-1', city: 'Mumbai', state: 'Maharashtra' }],
    reviewsAsProfessional: [{ id: 'rev-1', rating: 5, comment: 'Excellent', client: { id: 'client-1', name: 'Client' }, createdAt: new Date() }],
    locations: [{ id: 'loc-1', address: '123 Main St', city: 'Mumbai', lat: 19.076, lng: 72.8777 }],
    deletedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockService = {
    id: 'svc-1',
    companyId: 'company-1',
    name: 'Tax Filing',
    description: 'Annual tax filing',
    price: 5000,
    isActive: true,
    sortOrder: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockBooking = {
    id: 'booking-1',
    companyId: 'company-1',
    clientId: 'client-1',
    professionalServiceId: 'svc-1',
    status: 'PENDING',
    scheduledAt: new Date('2026-07-01T10:00:00Z'),
    duration: 60,
    amount: 5000,
    paymentStatus: 'PENDING',
    notes: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockReview = {
    id: 'rev-1',
    bookingId: 'booking-1',
    companyId: 'company-1',
    clientId: 'client-1',
    rating: 5,
    comment: 'Excellent service',
    isVerifiedBooking: true,
    createdAt: new Date(),
  };

  beforeEach(async () => {
    prisma = createMockPrisma();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TradeservService,
        { provide: PrismaService, useValue: prisma },
        { provide: CatalogAdapterService, useValue: { getCatalogItem: jest.fn() } },
        { provide: NotificationService, useValue: { createWithTemplate: jest.fn().mockResolvedValue({ id: 'notif-1' }) } },
        { provide: RazorpayService, useValue: { verifyPaymentSignature: jest.fn().mockReturnValue(true) } },
        { provide: GocashIntegrationService, useValue: { awardBookingCompleted: jest.fn().mockResolvedValue(undefined), awardReviewSubmitted: jest.fn().mockResolvedValue(undefined), awardProfessionalSignup: jest.fn().mockResolvedValue(undefined) } },
        { provide: BookingFinancialOrchestratorService, useValue: { processPaymentVerified: jest.fn().mockResolvedValue(undefined), processBookingCompleted: jest.fn().mockResolvedValue(undefined) } },
      ],
    }).compile();

    service = module.get<TradeservService>(TradeservService);
    jest.clearAllMocks();
  });

  describe('getProfessionalBySlug', () => {
    it('should return professional by slug', async () => {
      prisma.company.findUnique.mockResolvedValue(mockCompany);
      const result = await service.getProfessionalBySlug('test-professional');
      expect(result).toEqual(mockCompany);
      expect(result.professionalType).toBe('CHARTERED_ACCOUNTANT');
    });

    it('should throw NotFoundException for non-professional company', async () => {
      prisma.company.findUnique.mockResolvedValue({ ...mockCompany, professionalType: null });
      await expect(service.getProfessionalBySlug('test-professional')).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException for missing company', async () => {
      prisma.company.findUnique.mockResolvedValue(null);
      await expect(service.getProfessionalBySlug('nonexistent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('getProfessionalSummary', () => {
    it('should return summary for professional company', async () => {
      prisma.company.findUnique.mockResolvedValue(mockCompany);
      prisma.professionalService.findMany.mockResolvedValue([mockService]);
      const result = await service.getProfessionalSummary('test-professional');
      expect(result).toBeDefined();
    });

    it('should throw NotFoundException for missing professional', async () => {
      prisma.company.findUnique.mockResolvedValue(null);
      await expect(service.getProfessionalSummary('nonexistent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('addService', () => {
    const createDto = { name: 'New Service', description: 'Description', price: 3000, isActive: true };

    it('should create a service successfully', async () => {
      prisma.company.findUnique.mockResolvedValue(mockCompany);
      prisma.professionalService.create.mockResolvedValue({ id: 'svc-new', ...createDto, companyId: 'company-1', sortOrder: 2, createdAt: new Date(), updatedAt: new Date() });
      const result = await service.addService('company-1', createDto);
      expect(result).toBeDefined();
      expect(prisma.professionalService.create).toHaveBeenCalled();
    });

    it('should throw NotFoundException for non-professional company', async () => {
      prisma.company.findUnique.mockResolvedValue({ ...mockCompany, professionalType: null });
      await expect(service.addService('company-1', createDto)).rejects.toThrow(NotFoundException);
    });
  });

  describe('updateService', () => {
    it('should update a service', async () => {
      prisma.professionalService.findUnique.mockResolvedValue(mockService);
      prisma.company.findUnique.mockResolvedValue(mockCompany);
      prisma.professionalService.update.mockResolvedValue({ ...mockService, name: 'Updated' });
      const result = await service.updateService('company-1', 'svc-1', { name: 'Updated' });
      expect(result).toBeDefined();
    });

    it('should throw NotFoundException for missing service', async () => {
      prisma.professionalService.findUnique.mockResolvedValue(null);
      await expect(service.updateService('company-1', 'nonexistent', { name: 'Updated' })).rejects.toThrow(NotFoundException);
    });
  });

  describe('deleteService', () => {
    it('should delete a service', async () => {
      prisma.professionalService.findUnique.mockResolvedValue(mockService);
      prisma.company.findUnique.mockResolvedValue(mockCompany);
      prisma.professionalService.delete.mockResolvedValue(mockService);
      const result = await service.deleteService('company-1', 'svc-1');
      expect(result).toBeDefined();
    });
  });

  describe('createBooking', () => {
    it('should create a booking', async () => {
      prisma.professionalService.findUnique.mockResolvedValue(mockService);
      prisma.company.findUnique.mockResolvedValue(mockCompany);
      prisma.booking.create.mockResolvedValue(mockBooking);
      const dto = { companyId: 'company-1', serviceId: 'svc-1', scheduledAt: new Date(Date.now() + 86400000).toISOString(), durationMinutes: 60 };
      const result = await service.createBooking('client-1', dto);
      expect(result).toBeDefined();
    });

    it('should throw if service not found', async () => {
      prisma.company.findUnique.mockResolvedValue(mockCompany);
      prisma.professionalService.findUnique.mockResolvedValue(null);
      const dto = { companyId: 'company-1', serviceId: 'nonexistent', scheduledAt: new Date(Date.now() + 86400000).toISOString(), durationMinutes: 60 };
      await expect(service.createBooking('client-1', dto)).rejects.toThrow(NotFoundException);
    });
  });

  describe('createReview', () => {
    it('should create a review for completed booking', async () => {
      prisma.booking.findUnique.mockResolvedValue({ ...mockBooking, status: 'COMPLETED', companyId: 'company-1' });
      prisma.company.findUnique.mockResolvedValue(mockCompany);
      prisma.professionalReview.create.mockResolvedValue(mockReview);
      const dto = { bookingId: 'booking-1', rating: 5, comment: 'Excellent service' };
      const result = await service.createReview('company-1', 'client-1', dto);
      expect(result).toBeDefined();
      expect(prisma.professionalReview.create).toHaveBeenCalled();
    });

    it('should throw BadRequestException for non-completed booking', async () => {
      prisma.booking.findUnique.mockResolvedValue({ ...mockBooking, status: 'PENDING' });
      const dto = { bookingId: 'booking-1', rating: 5, comment: 'Good' };
      await expect(service.createReview('company-1', 'client-1', dto)).rejects.toThrow(BadRequestException);
    });
  });
});
