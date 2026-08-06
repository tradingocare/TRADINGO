import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CatalogAdapterService } from '../catalog-adapter/catalog-adapter.service';
import { NotificationService } from '../notification/notification.service';
import { RazorpayService } from '../payment/gateways/razorpay.service';
import { Prisma, ProfessionalCompanyStatus, BookingPaymentStatus, BookingStatus, NotificationType } from '@prisma/client';
import { GocashIntegrationService } from '../gocash-integration/gocash-integration.service';
import { BookingFinancialOrchestratorService } from './booking-financial-orchestrator.service';

@Injectable()
export class TradeservService {
  private readonly logger = new Logger(TradeservService.name);
  private indexSyncService: { indexProfessional(companyId: string): Promise<void>; removeProfessional(companyId: string): Promise<void> } | null = null;

  constructor(
    private readonly prisma: PrismaService,
    private readonly catalogAdapter: CatalogAdapterService,
    private readonly notificationService: NotificationService,
    private readonly razorpayService: RazorpayService,
    private readonly gocashIntegration: GocashIntegrationService,
    private readonly financialOrchestrator: BookingFinancialOrchestratorService,
  ) {}

  setIndexSyncService(service: { indexProfessional(companyId: string): Promise<void>; removeProfessional(companyId: string): Promise<void> }) {
    this.indexSyncService = service;
  }

  async getProfessionalBySlug(slug: string) {
    const company = await this.prisma.company.findUnique({
      where: { slug },
      include: {
        professionalServices: { where: { isActive: true }, orderBy: { sortOrder: 'asc' } },
        professionalPortfolio: { orderBy: { sortOrder: 'asc' } },
        professionalCertifications: { orderBy: { issueDate: 'desc' } },
        professionalAvailability: { orderBy: { dayOfWeek: 'asc' } },
        professionalLanguages: true,
        professionalServiceAreas: true,
        reviewsAsProfessional: { include: { client: true }, orderBy: { createdAt: 'desc' }, take: 10 },
        locations: true,
      },
    });
    if (!company?.professionalType) {
      throw new NotFoundException('Professional not found');
    }
    return company;
  }

  async getProfessionalSummary(slug: string) {
    const company = await this.prisma.company.findUnique({
      where: { slug, professionalType: { not: null } },
      select: {
        id: true, name: true, slug: true, logo: true, professionalType: true,
        description: true, trustScore: true, verificationLevel: true,
        responseTimeMinutes: true, lastActiveAt: true, videoIntroductionUrl: true,
        socialLinks: true, professionalStatus: true,
        locations: { select: { city: true, state: true } },
        _count: { select: { professionalServices: true, professionalPortfolio: true, reviewsAsProfessional: true } },
      },
    });
    if (!company) throw new NotFoundException('Professional not found');

    const avgRating = await this.prisma.professionalReview.aggregate({
      where: { companyId: company.id },
      _avg: { rating: true },
    });
    const languages = await this.prisma.professionalLanguage.findMany({
      where: { companyId: company.id },
      select: { language: true },
    });

    return {
      ...company,
      serviceCount: company._count.professionalServices,
      portfolioCount: company._count.professionalPortfolio,
      reviewCount: company._count.reviewsAsProfessional,
      averageRating: avgRating._avg.rating || 0,
      locations: company.locations.map(l => l.city),
      languages: languages.map(l => l.language),
      _count: undefined,
    };
  }

  async searchProfessionals(params: {
    query?: string; category?: string; city?: string; professionalType?: string;
    minRating?: number; maxPrice?: number; sortBy?: string; sortOrder?: 'asc' | 'desc';
    page?: number; limit?: number;
  }) {
    const { page = 1, limit = 20 } = params;
    const skip = (page - 1) * limit;

    const where: Prisma.CompanyWhereInput = {
      professionalType: { not: null },
      professionalStatus: ProfessionalCompanyStatus.APPROVED,
    };

    if (params.query) {
      where.OR = [
        { name: { contains: params.query, mode: 'insensitive' } },
        { description: { contains: params.query, mode: 'insensitive' } },
      ];
    }
    if (params.professionalType) {
      where.professionalType = params.professionalType as any;
    }
    if (params.city) {
      where.locations = { some: { city: { contains: params.city, mode: 'insensitive' } } };
    }
    if (params.minRating) {
      where.reviewsAsProfessional = { some: { rating: { gte: params.minRating } } };
    }

    if (params.category) {
      where.professionalServices = {
        some: { category: { contains: params.category, mode: 'insensitive' }, isActive: true },
      };
    }

    const orderBy: Prisma.CompanyOrderByWithRelationInput = {};
    if (params.sortBy === 'trustScore') orderBy.trustScore = params.sortOrder || 'desc';
    else if (params.sortBy === 'name') orderBy.name = params.sortOrder || 'asc';
    else if (params.sortBy === 'lastActiveAt') orderBy.lastActiveAt = params.sortOrder || 'desc';
    else orderBy.trustScore = 'desc';

    const [data, total] = await Promise.all([
      this.prisma.company.findMany({
        where,
        orderBy,
        skip,
        take: limit,
        select: {
          id: true, name: true, slug: true, logo: true, professionalType: true,
          description: true, trustScore: true, verificationLevel: true,
          responseTimeMinutes: true, lastActiveAt: true, professionalStatus: true,
          locations: { select: { city: true, state: true } },
          _count: { select: { professionalServices: true, reviewsAsProfessional: true } },
        },
      }),
      this.prisma.company.count({ where }),
    ]);

    return {
      data: data.map(c => ({
        ...c, serviceCount: c._count.professionalServices,
        reviewCount: c._count.reviewsAsProfessional, _count: undefined,
        locations: c.locations.map(l => l.city),
      })),
      meta: { total, page, limit, totalPages: Math.ceil(total / limit), hasNext: skip + limit < total, hasPrevious: page > 1 },
    };
  }

  async getFeaturedProfessionals(limit = 10) {
    return this.prisma.company.findMany({
      where: { professionalType: { not: null }, professionalStatus: ProfessionalCompanyStatus.APPROVED },
      orderBy: { trustScore: 'desc' },
      take: limit,
      select: {
        id: true, name: true, slug: true, logo: true, professionalType: true,
        description: true, trustScore: true, verificationLevel: true,
        responseTimeMinutes: true, lastActiveAt: true,
        locations: { select: { city: true }, take: 1 },
        _count: { select: { professionalServices: true, reviewsAsProfessional: true } },
      },
    });
  }

  async getProfessionalCategories(enriched?: boolean) {
    const raw = await this.prisma.professionalService.groupBy({
      by: ['category'],
      where: { category: { not: null }, isActive: true },
      _count: { category: true },
      orderBy: { _count: { category: 'desc' } },
    });

    if (!enriched) return raw;

    const enrichedCategories = await Promise.all(
      raw.map(async (entry) => {
        const catalogResult = entry.category
          ? await this.catalogAdapter.unifiedSearch(entry.category, {
              includeOld: false,
              includeCatalog: true,
              limit: 1,
            })
          : [];
        const catalogMatch = catalogResult.length > 0 ? catalogResult[0] : null;
        return {
          category: entry.category,
          _count: entry._count.category,
          catalogCategory: catalogMatch
            ? { id: catalogMatch.id, name: catalogMatch.name, type: catalogMatch.type }
            : null,
        };
      }),
    );

    return enrichedCategories;
  }

  async resolveServiceCategory(categoryName: string) {
    const catalogResult = await this.catalogAdapter.unifiedSearch(categoryName, {
      includeOld: false,
      includeCatalog: true,
      limit: 5,
    });

    return {
      query: categoryName,
      resolved: catalogResult.map((r) => ({
        id: r.id,
        name: r.name,
        type: r.type,
        parentName: r.parentName,
      })),
      matchedCount: catalogResult.length,
    };
  }

  async getEnrichedService(id: string) {
    const service = await this.prisma.professionalService.findUnique({ where: { id } });
    if (!service) throw new NotFoundException('Service not found');

    const catalogResult = service.category
      ? await this.catalogAdapter.unifiedSearch(service.category, {
          includeOld: false,
          includeCatalog: true,
          limit: 1,
        })
      : [];

    return {
      ...service,
      catalogCategory: catalogResult.length > 0
        ? { id: catalogResult[0].id, name: catalogResult[0].name, type: catalogResult[0].type }
        : null,
    };
  }

  async registerProfessional(userId: string, dto: { fullName: string; professionalTitle: string; professionalType: string; companyName: string; mobile?: string; email?: string }) {
    const company = await this.prisma.company.create({
      data: {
        name: dto.companyName,
        slug: dto.companyName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') + '-' + Math.random().toString(36).slice(2, 6),
        professionalType: dto.professionalType as any,
        professionalStatus: ProfessionalCompanyStatus.PENDING_REVIEW,
        businessType: 'PROFESSIONAL' as any,
        description: dto.professionalTitle,
        mobile: dto.mobile,
        email: dto.email,
        createdBy: userId,
        updatedBy: userId,
        owners: { create: { userId, isPrimary: true } },
      },
    });
    this.indexSyncService?.indexProfessional(company.id).catch((err) => this.logger.warn(`Index sync failed for professional ${company.id}: ${(err as Error).message}`));
    // Reward professional signup (non-blocking — wallet may not exist yet)
    this.gocashIntegration.awardProfessionalSignup(userId, company.id)
      .catch((err) => this.logger.warn(`Professional signup reward failed: ${(err as Error).message}`));
    return company;
  }

  async updateCompanyProfile(companyId: string, dto: Record<string, unknown>) {
    const result = await this.prisma.company.update({ where: { id: companyId }, data: dto });
    this.indexSyncService?.indexProfessional(companyId).catch((err) => this.logger.warn(`Index sync failed: ${(err as Error).message}`));
    return result;
  }

  async addService(companyId: string, dto: any) {
    const service = await this.prisma.professionalService.create({ data: { ...dto, companyId } });
    this.indexSyncService?.indexProfessional(companyId).catch((err) => this.logger.warn(`Index sync failed: ${(err as Error).message}`));
    return service;
  }

  async updateService(id: string, companyId: string, dto: any) {
    const existing = await this.prisma.professionalService.findFirst({ where: { id, companyId } });
    if (!existing) throw new NotFoundException('Service not found');
    const service = await this.prisma.professionalService.update({ where: { id }, data: dto });
    this.indexSyncService?.indexProfessional(companyId).catch((err) => this.logger.warn(`Index sync failed: ${(err as Error).message}`));
    return service;
  }

  async deleteService(id: string, companyId: string) {
    const existing = await this.prisma.professionalService.findFirst({ where: { id, companyId } });
    if (!existing) throw new NotFoundException('Service not found');
    const result = await this.prisma.professionalService.delete({ where: { id } });
    this.indexSyncService?.indexProfessional(companyId).catch((err) => this.logger.warn(`Index sync failed: ${(err as Error).message}`));
    return result;
  }

  async addPortfolioItem(companyId: string, dto: any) {
    const item = await this.prisma.professionalPortfolio.create({ data: { ...dto, companyId } });
    this.indexSyncService?.indexProfessional(companyId).catch((err) => this.logger.warn(`Index sync failed: ${(err as Error).message}`));
    return item;
  }

  async updatePortfolioItem(id: string, companyId: string, dto: any) {
    const existing = await this.prisma.professionalPortfolio.findFirst({ where: { id, companyId } });
    if (!existing) throw new NotFoundException('Portfolio item not found');
    const item = await this.prisma.professionalPortfolio.update({ where: { id }, data: dto });
    this.indexSyncService?.indexProfessional(companyId).catch((err) => this.logger.warn(`Index sync failed: ${(err as Error).message}`));
    return item;
  }

  async deletePortfolioItem(id: string, companyId: string) {
    const existing = await this.prisma.professionalPortfolio.findFirst({ where: { id, companyId } });
    if (!existing) throw new NotFoundException('Portfolio item not found');
    const result = await this.prisma.professionalPortfolio.delete({ where: { id } });
    this.indexSyncService?.indexProfessional(companyId).catch((err) => this.logger.warn(`Index sync failed: ${(err as Error).message}`));
    return result;
  }

  async addCertification(companyId: string, dto: any) {
    const cert = await this.prisma.professionalCertification.create({ data: { ...dto, companyId, issueDate: new Date(dto.issueDate), expiryDate: dto.expiryDate ? new Date(dto.expiryDate) : undefined } });
    this.indexSyncService?.indexProfessional(companyId).catch((err) => this.logger.warn(`Index sync failed: ${(err as Error).message}`));
    return cert;
  }

  async updateCertification(id: string, companyId: string, dto: any) {
    const existing = await this.prisma.professionalCertification.findFirst({ where: { id, companyId } });
    if (!existing) throw new NotFoundException('Certification not found');
    const data = { ...dto };
    if (dto.issueDate) data.issueDate = new Date(dto.issueDate);
    if (dto.expiryDate) data.expiryDate = new Date(dto.expiryDate);
    const cert = await this.prisma.professionalCertification.update({ where: { id }, data });
    this.indexSyncService?.indexProfessional(companyId).catch((err) => this.logger.warn(`Index sync failed: ${(err as Error).message}`));
    return cert;
  }

  async deleteCertification(id: string, companyId: string) {
    const existing = await this.prisma.professionalCertification.findFirst({ where: { id, companyId } });
    if (!existing) throw new NotFoundException('Certification not found');
    const result = await this.prisma.professionalCertification.delete({ where: { id } });
    this.indexSyncService?.indexProfessional(companyId).catch((err) => this.logger.warn(`Index sync failed: ${(err as Error).message}`));
    return result;
  }

  async setAvailability(companyId: string, dto: { dayOfWeek: number; startTime: string; endTime: string; isAvailable?: boolean }) {
    return this.prisma.professionalAvailability.upsert({
      where: { companyId_dayOfWeek: { companyId, dayOfWeek: dto.dayOfWeek } },
      create: { ...dto, companyId },
      update: { startTime: dto.startTime, endTime: dto.endTime, isAvailable: dto.isAvailable ?? true },
    });
  }

  async addLanguage(companyId: string, dto: { language: string; proficiency?: string }) {
    return this.prisma.professionalLanguage.upsert({
      where: { companyId_language: { companyId, language: dto.language } },
      create: { ...dto, companyId },
      update: { proficiency: dto.proficiency },
    });
  }

  async removeLanguage(companyId: string, language: string) {
    const existing = await this.prisma.professionalLanguage.findFirst({ where: { companyId, language } });
    if (!existing) throw new NotFoundException('Language not found');
    return this.prisma.professionalLanguage.delete({ where: { id: existing.id } });
  }

  async addServiceArea(companyId: string, dto: any) {
    return this.prisma.professionalServiceArea.create({ data: { ...dto, companyId } });
  }

  async removeServiceArea(id: string, companyId: string) {
    const existing = await this.prisma.professionalServiceArea.findFirst({ where: { id, companyId } });
    if (!existing) throw new NotFoundException('Service area not found');
    return this.prisma.professionalServiceArea.delete({ where: { id } });
  }

  async checkAvailability(
    companyId: string,
    scheduledAt: Date,
    durationMinutes: number,
    excludeBookingId?: string,
  ) {
    const scheduledEnd = new Date(scheduledAt.getTime() + durationMinutes * 60000);

    const where: Prisma.BookingWhereInput = {
      companyId,
      status: { in: [BookingStatus.PENDING, BookingStatus.CONFIRMED, BookingStatus.IN_PROGRESS] },
      scheduledAt: { lt: scheduledEnd },
    };

    if (excludeBookingId) {
      where.id = { not: excludeBookingId };
    }

    const existingBookings = await this.prisma.booking.findMany({
      where,
      select: { id: true, scheduledAt: true, durationMinutes: true, status: true },
    });

    const conflicts = existingBookings.filter((existing) => {
      const existingEnd = new Date(
        existing.scheduledAt.getTime() + (existing.durationMinutes || 60) * 60000,
      );
      return existingEnd > scheduledAt;
    });

    if (conflicts.length > 0) {
      const conflictDetails = conflicts.map(
        (c) =>
          `${c.id}: ${c.scheduledAt.toISOString()} (${c.durationMinutes || 60}min, ${c.status})`,
      );
      this.logger.warn(
        `Availability conflict for company ${companyId}: ${conflictDetails.join(', ')}`,
      );
      throw new BadRequestException({
        message: 'Booking conflicts with existing appointments',
        conflicts: conflicts.map((c) => ({
          id: c.id,
          scheduledAt: c.scheduledAt,
          durationMinutes: c.durationMinutes || 60,
          status: c.status,
        })),
      });
    }

    return { available: true };
  }

  async createBooking(
    clientId: string,
    dto: {
      companyId: string;
      serviceId?: string;
      scheduledAt: string;
      durationMinutes?: number;
      notes?: string;
      meetingLink?: string;
      location?: string;
    },
  ) {
    const scheduledAt = new Date(dto.scheduledAt);
    if (isNaN(scheduledAt.getTime())) {
      throw new BadRequestException('Invalid scheduledAt date');
    }
    if (scheduledAt <= new Date()) {
      throw new BadRequestException('scheduledAt must be in the future');
    }

    const durationMinutes = dto.durationMinutes || 60;

    const company = await this.prisma.company.findUnique({
      where: { id: dto.companyId },
      select: { id: true, professionalType: true, professionalStatus: true },
    });
    if (!company?.professionalType) {
      throw new NotFoundException('Professional not found');
    }
    if (company.professionalStatus !== ProfessionalCompanyStatus.APPROVED) {
      throw new BadRequestException('Professional is not yet approved');
    }

    await this.checkAvailability(dto.companyId, scheduledAt, durationMinutes);

    let amount: number | undefined;
    if (dto.serviceId) {
      const service = await this.prisma.professionalService.findUnique({
        where: { id: dto.serviceId },
        select: { priceMin: true, priceMax: true },
      });
      if (service && service.priceMin) {
        const minPrice = Number(service.priceMin);
        const maxPrice = service.priceMax ? Number(service.priceMax) : minPrice;
        amount = maxPrice > minPrice ? maxPrice : minPrice;
      }
    }

    const booking = await this.prisma.booking.create({
      data: {
        companyId: dto.companyId,
        clientId,
        serviceId: dto.serviceId,
        scheduledAt,
        durationMinutes,
        amount: amount ?? undefined,
        notes: dto.notes,
        meetingLink: dto.meetingLink,
        location: dto.location,
      },
    });

    await this.notificationService.createWithTemplate(
      dto.companyId,
      undefined,
      NotificationType.BOOKING_CREATED,
      { date: dto.scheduledAt, clientName: clientId },
      { sourceModule: 'TRADESERV', link: '/seller/tradeserv/bookings' },
    ).catch((err) => this.logger.warn(`BOOKING_CREATED notification failed: ${(err as Error).message}`));

    return booking;
  }

  async updateBookingStatus(bookingId: string, userId: string, dto: { status: string; cancelReason?: string; meetingLink?: string }) {
    const booking = await this.prisma.booking.findUnique({ where: { id: bookingId } });
    if (!booking) throw new NotFoundException('Booking not found');

    const validTransitions: Record<string, string[]> = {
      PENDING: ['CONFIRMED', 'CANCELLED'],
      CONFIRMED: ['IN_PROGRESS', 'CANCELLED'],
      IN_PROGRESS: ['COMPLETED', 'CANCELLED'],
    };

    const allowed = validTransitions[booking.status];
    if (!allowed?.includes(dto.status)) {
      throw new BadRequestException(
        `Cannot transition booking from ${booking.status} to ${dto.status}`,
      );
    }

    if (dto.status === 'CONFIRMED' && booking.amount && booking.amount.toNumber() > 0) {
      if (booking.paymentStatus !== BookingPaymentStatus.PAID) {
        throw new BadRequestException('Booking cannot be confirmed until payment is completed');
      }
    }

    const data: any = { status: dto.status };
    if (dto.status === 'CANCELLED') { data.cancelledAt = new Date(); data.cancelReason = dto.cancelReason; }
    if (dto.status === 'CONFIRMED') { data.meetingLink = dto.meetingLink; }
    if (dto.status === 'COMPLETED') { data.completedAt = new Date(); }

    const updated = await this.prisma.booking.update({ where: { id: bookingId }, data });

    await this.prisma.auditLog.create({
      data: {
        userId,
        action: `BOOKING_${dto.status}`,
        resource: 'booking',
        metadata: {
          bookingId,
          previousStatus: booking.status,
          newStatus: dto.status,
          cancelReason: dto.cancelReason,
        },
      },
    });

    const dateStr = booking.scheduledAt.toISOString().split('T')[0];
    if (dto.status === 'CONFIRMED') {
      await this.notificationService.createWithTemplate(
        booking.clientId,
        undefined,
        NotificationType.BOOKING_CONFIRMED,
        { date: dateStr, professionalName: booking.companyId },
        { sourceModule: 'TRADESERV', link: '/buyer/tradeserv/bookings' },
      ).catch((err) => this.logger.warn(`BOOKING_CONFIRMED notification failed: ${(err as Error).message}`));
    } else if (dto.status === 'COMPLETED') {
      await this.notificationService.createWithTemplate(
        booking.clientId,
        undefined,
        NotificationType.BOOKING_COMPLETED,
        { date: dateStr, professionalName: booking.companyId },
        { sourceModule: 'TRADESERV', link: '/buyer/tradeserv/bookings' },
      ).catch((err) => this.logger.warn(`BOOKING_COMPLETED notification failed: ${(err as Error).message}`));
      // Reward client for booking completion
      this.awardBookingCompletionReward(bookingId, booking.clientId);
      // Financial settlement — failure-isolated, never rolls back booking completion
      this.financialOrchestrator.processBookingCompleted(bookingId, userId)
        .catch((err) => this.logger.warn(`Settlement processing failed for booking ${bookingId}: ${(err as Error).message}`));
    } else if (dto.status === 'CANCELLED') {
      await this.notificationService.createWithTemplate(
        booking.clientId,
        undefined,
        NotificationType.BOOKING_CANCELLED,
        { date: dateStr, reason: dto.cancelReason || 'No reason provided' },
        { sourceModule: 'TRADESERV', link: '/buyer/tradeserv/bookings' },
      ).catch((err) => this.logger.warn(`BOOKING_CANCELLED notification failed: ${(err as Error).message}`));
    }

    return updated;
  }

  async getBookingById(id: string, userId: string) {
    const booking = await this.prisma.booking.findUnique({
      where: { id },
      include: {
        service: true,
        company: { select: { id: true, name: true, slug: true, logo: true, email: true, mobile: true } },
        client: { select: { id: true, name: true, slug: true, logo: true, email: true, mobile: true } },
        reviews: true,
      },
    });
    if (!booking) throw new NotFoundException('Booking not found');

    const userCompanyIds = await this.prisma.companyOwner.findMany({
      where: { userId },
      select: { companyId: true },
    });
    const ownedCompanyIds = new Set(userCompanyIds.map((c) => c.companyId));
    if (!ownedCompanyIds.has(booking.companyId) && !ownedCompanyIds.has(booking.clientId)) {
      throw new NotFoundException('Booking not found');
    }

    return booking;
  }

  async getBookings(companyId: string, role: 'professional' | 'client', page = 1, limit = 20, status?: string) {
    const safeLimit = Math.min(Math.max(1, limit), 100);
    const skip = (page - 1) * safeLimit;
    const where: Prisma.BookingWhereInput = role === 'professional' ? { companyId } : { clientId: companyId };
    if (status) where.status = status as BookingStatus;
    const [data, total] = await Promise.all([
      this.prisma.booking.findMany({
        where,
        skip,
        take: safeLimit,
        include: { service: true, company: { select: { name: true, slug: true, logo: true } } },
        orderBy: { scheduledAt: 'desc' },
      }),
      this.prisma.booking.count({ where }),
    ]);
    return {
      data,
      meta: { total, page, limit: safeLimit, totalPages: Math.ceil(total / safeLimit), hasNext: page * safeLimit < total, hasPrevious: page > 1 },
    };
  }

  async createProposal(companyId: string, clientId: string, dto: any) {
    const proposal = await this.prisma.proposal.create({ data: { ...dto, companyId, clientId } });

    await this.notificationService.createWithTemplate(
      clientId,
      undefined,
      NotificationType.PROPOSAL_SUBMITTED,
      { professionalName: companyId },
      { sourceModule: 'TRADESERV', link: '/buyer/tradeserv/proposals' },
    ).catch((err) => this.logger.warn(`PROPOSAL_SUBMITTED notification failed: ${(err as Error).message}`));

    return proposal;
  }

  async updateProposalStatus(proposalId: string, companyId: string, dto: { status: string; rejectionReason?: string }) {
    const proposal = await this.prisma.proposal.findFirst({ where: { id: proposalId, companyId } });
    if (!proposal) throw new NotFoundException('Proposal not found');

    const data: any = { status: dto.status };
    if (dto.status === 'SENT') data.sentAt = new Date();
    if (dto.status === 'ACCEPTED') data.acceptedAt = new Date();
    if (dto.status === 'REJECTED') { data.rejectedAt = new Date(); data.rejectionReason = dto.rejectionReason; }

    const updated = await this.prisma.proposal.update({ where: { id: proposalId }, data });

    if (dto.status === 'ACCEPTED') {
      await this.notificationService.createWithTemplate(
        proposal.companyId,
        undefined,
        NotificationType.PROPOSAL_ACCEPTED,
        { clientName: proposal.clientId },
        { sourceModule: 'TRADESERV', link: '/seller/tradeserv/proposals' },
      ).catch((err) => this.logger.warn(`PROPOSAL_ACCEPTED notification failed: ${(err as Error).message}`));
    } else if (dto.status === 'REJECTED') {
      await this.notificationService.createWithTemplate(
        proposal.companyId,
        undefined,
        NotificationType.PROPOSAL_REJECTED,
        { clientName: proposal.clientId },
        { sourceModule: 'TRADESERV', link: '/seller/tradeserv/proposals' },
      ).catch((err) => this.logger.warn(`PROPOSAL_REJECTED notification failed: ${(err as Error).message}`));
    }

    return updated;
  }

  async getProposals(companyId: string, role: 'professional' | 'client', page = 1, limit = 20) {
    const safeLimit = Math.min(Math.max(1, limit), 100);
    const skip = (page - 1) * safeLimit;
    const where = role === 'professional' ? { companyId } : { clientId: companyId };
    const [data, total] = await Promise.all([
      this.prisma.proposal.findMany({
        where,
        skip,
        take: safeLimit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.proposal.count({ where }),
    ]);
    return {
      data,
      meta: { total, page, limit: safeLimit, totalPages: Math.ceil(total / safeLimit), hasNext: page * safeLimit < total, hasPrevious: page > 1 },
    };
  }

  async createReview(clientId: string, userId: string, dto: { bookingId: string; rating: number; title?: string; description?: string; rehired?: boolean }) {
    const booking = await this.prisma.booking.findUnique({ where: { id: dto.bookingId } });
    if (!booking) throw new NotFoundException('Booking not found');
    if (booking.clientId !== clientId) throw new BadRequestException('You can only review your own bookings');
    if (booking.status !== 'COMPLETED') throw new BadRequestException('Can only review completed bookings');

    const review = await this.prisma.professionalReview.create({ data: { ...dto, companyId: booking.companyId, clientId } });

    // Notify professional about the review
    await this.notificationService.createWithTemplate(
      booking.companyId,
      undefined,
      NotificationType.REVIEW_SUBMITTED,
      { reviewerName: clientId, rating: dto.rating },
      { sourceModule: 'TRADESERV', link: '/seller/tradeserv/bookings' },
    ).catch((err) => this.logger.warn(`REVIEW_SUBMITTED notification failed: ${(err as Error).message}`));

    // Reward the reviewer
    this.gocashIntegration.awardReviewSubmitted(review.id, userId, clientId)
      .catch((err) => this.logger.warn(`Review reward failed: ${(err as Error).message}`));

    return review;
  }

  async createBookingPaymentOrder(bookingId: string, companyId: string, amount: number, currency = 'INR') {
    const booking = await this.prisma.booking.findUnique({ where: { id: bookingId } });
    if (!booking) throw new NotFoundException('Booking not found');
    if (booking.clientId !== companyId) throw new BadRequestException('Only the booking client can pay');

    if (booking.status === BookingStatus.CANCELLED) {
      throw new BadRequestException('Cannot pay for a cancelled booking');
    }
    if (booking.paymentStatus === BookingPaymentStatus.PAID) {
      throw new BadRequestException('Booking is already paid');
    }

    const existingPayment = await this.prisma.payment.findFirst({
      where: {
        companyId,
        status: 'PENDING',
        notes: { path: ['bookingId'], equals: bookingId },
      },
    });
    if (existingPayment) {
      this.logger.log(`Returning existing PENDING payment ${existingPayment.id} for booking ${bookingId}`);
      return {
        id: existingPayment.id,
        gatewayOrderId: existingPayment.gatewayOrderId,
        amount: existingPayment.amount,
        currency: existingPayment.currency || 'INR',
        keyId: this.razorpayService.getKeyId(),
      };
    }

    const receipt = `bk_${companyId.slice(0, 8)}_${Date.now()}`;
    const razorpayOrder = await this.razorpayService.createOrder(amount, currency, receipt, {
      companyId,
      bookingId,
      type: 'BOOKING_PAYMENT',
    });

    const payment = await this.prisma.payment.create({
      data: {
        companyId,
        type: 'BOOKING_PAYMENT',
        gateway: 'RAZORPAY',
        status: 'PENDING',
        gatewayOrderId: razorpayOrder.id,
        amount,
        currency,
        description: `Booking payment: ${bookingId}`,
        notes: { bookingId },
      },
    });

    await this.prisma.booking.update({
      where: { id: bookingId },
      data: {
        paymentId: payment.id,
        paymentStatus: BookingPaymentStatus.PENDING,
        amount: amount / 100,
      },
    });

    return {
      id: payment.id,
      bookingId,
      gatewayOrderId: razorpayOrder.id,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
      keyId: this.razorpayService.getKeyId(),
    };
  }

  async verifyBookingPayment(
    bookingId: string,
    companyId: string,
    dto: {
      razorpayPaymentId: string;
      razorpayOrderId: string;
      razorpaySignature: string;
    },
  ) {
    const booking = await this.prisma.booking.findUnique({ where: { id: bookingId } });
    if (!booking) throw new NotFoundException('Booking not found');
    if (booking.clientId !== companyId) throw new BadRequestException('Only the booking client can verify payment');

    const payment = await this.prisma.payment.findFirst({
      where: {
        companyId,
        gatewayOrderId: dto.razorpayOrderId,
        status: 'PENDING',
      },
    });
    if (!payment) throw new NotFoundException('Payment record not found');

    const isValid = this.razorpayService.verifyPayment({
      gatewayOrderId: dto.razorpayOrderId,
      gatewayPaymentId: dto.razorpayPaymentId,
      gatewaySignature: dto.razorpaySignature,
    });
    if (!isValid) {
      await this.notificationService.createWithTemplate(
        booking.companyId,
        undefined,
        NotificationType.BOOKING_PAYMENT_FAILED,
        { date: booking.scheduledAt.toISOString().split('T')[0], reason: 'Signature mismatch — payment could not be verified' },
        { sourceModule: 'TRADESERV', link: '/seller/tradeserv/bookings' },
      ).catch((err) => this.logger.warn(`BOOKING_PAYMENT_FAILED notification failed: ${(err as Error).message}`));
      throw new BadRequestException('Payment verification failed — signature mismatch');
    }

    const [updatedPayment] = await this.prisma.$transaction([
      this.prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: 'CAPTURED',
          gatewayPaymentId: dto.razorpayPaymentId,
          gatewaySignature: dto.razorpaySignature,
          paidAt: new Date(),
        },
      }),
      this.prisma.booking.update({
        where: { id: bookingId },
        data: {
          paymentStatus: BookingPaymentStatus.PAID,
          status: BookingStatus.CONFIRMED,
        },
      }),
    ]);

    try {
      const amountInRupees = (updatedPayment.amount / 100).toFixed(2);
      await this.notificationService.createWithTemplate(
        booking.companyId,
        undefined,
        NotificationType.BOOKING_CONFIRMED,
        { date: booking.scheduledAt.toISOString().split('T')[0], amount: amountInRupees },
        { sourceModule: 'TRADESERV', link: '/seller/tradeserv/bookings' },
      );
    } catch (err) {
      this.logger.error(`Failed to send BOOKING_CONFIRMED notification: ${(err as Error).message}`);
    }

    this.financialOrchestrator.processPaymentVerified(bookingId, booking.clientId)
      .catch((err) => this.logger.warn(`Escrow hold failed for booking ${bookingId}: ${(err as Error).message}`));

    return {
      success: true,
      bookingId,
      paymentId: payment.id,
      amount: updatedPayment.amount,
      paymentStatus: 'PAID',
      bookingStatus: 'CONFIRMED',
    };
  }

  async getAdminProfessionals(params: { page?: number; limit?: number; status?: string; search?: string }) {
    const { page = 1, limit = 20 } = params;
    const skip = (page - 1) * limit;
    const where: Prisma.CompanyWhereInput = { professionalType: { not: null } };
    if (params.status) where.professionalStatus = params.status as any;
    if (params.search) {
      where.OR = [
        { name: { contains: params.search, mode: 'insensitive' } },
        { email: { contains: params.search, mode: 'insensitive' } },
      ];
    }
    const [data, total] = await Promise.all([
      this.prisma.company.findMany({ where, skip, take: limit, orderBy: { createdAt: 'desc' }, select: { id: true, name: true, slug: true, logo: true, professionalType: true, professionalStatus: true, trustScore: true, verificationLevel: true, email: true, mobile: true, createdAt: true, _count: { select: { professionalServices: true, reviewsAsProfessional: true } } } }),
      this.prisma.company.count({ where }),
    ]);
    return { data, meta: { total, page, limit, totalPages: Math.ceil(total / limit), hasNext: skip + limit < total, hasPrevious: page > 1 } };
  }

  async getAdminBookings(params: { page?: number; limit?: number; status?: string }) {
    const { page = 1, limit = 20 } = params;
    const skip = (page - 1) * limit;
    const where: Prisma.BookingWhereInput = {};
    if (params.status) where.status = params.status as BookingStatus;
    const [data, total] = await Promise.all([
      this.prisma.booking.findMany({
        where,
        skip,
        take: limit,
        include: {
          service: { select: { name: true } },
          company: { select: { id: true, name: true, slug: true, logo: true } },
          client: { select: { id: true, name: true, slug: true, logo: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.booking.count({ where }),
    ]);
    return {
      data,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit), hasNext: skip + limit < total, hasPrevious: page > 1 },
    };
  }

  async getAdminBookingStats() {
    const [total, pending, confirmed, inProgress, completed, cancelled] = await Promise.all([
      this.prisma.booking.count(),
      this.prisma.booking.count({ where: { status: BookingStatus.PENDING } }),
      this.prisma.booking.count({ where: { status: BookingStatus.CONFIRMED } }),
      this.prisma.booking.count({ where: { status: BookingStatus.IN_PROGRESS } }),
      this.prisma.booking.count({ where: { status: BookingStatus.COMPLETED } }),
      this.prisma.booking.count({ where: { status: BookingStatus.CANCELLED } }),
    ]);
    return { total, pending, confirmed, inProgress, completed, cancelled };
  }

  async approveProfessional(companyId: string, status: ProfessionalCompanyStatus, reason?: string) {
    const data: any = { professionalStatus: status };
    if (status === 'APPROVED') data.professionalApprovedAt = new Date();
    if (status === 'REJECTED') { data.professionalRejectedAt = new Date(); data.professionalRejectedReason = reason; }
    const result = await this.prisma.company.update({ where: { id: companyId }, data });
    if (status === 'APPROVED') {
      this.indexSyncService?.indexProfessional(companyId).catch((err) => this.logger.warn(`Index sync failed: ${(err as Error).message}`));
    } else if (status === 'REJECTED') {
      this.indexSyncService?.removeProfessional(companyId).catch((err) => this.logger.warn(`Index sync failed: ${(err as Error).message}`));
    }
    return result;
  }

  async getDashboardStats(companyId: string) {
    const [services, portfolio, bookings, reviews, proposals] = await Promise.all([
      this.prisma.professionalService.count({ where: { companyId } }),
      this.prisma.professionalPortfolio.count({ where: { companyId } }),
      this.prisma.booking.count({ where: { companyId } }),
      this.prisma.professionalReview.count({ where: { companyId } }),
      this.prisma.proposal.count({ where: { companyId } }),
    ]);
    return { services, portfolio, bookings, reviews, proposals };
  }

  async getAnalytics(companyId: string) {
    const now = new Date();
    const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);

    const [totalReviews, recentBookings, proposals, profile] = await Promise.all([
      this.prisma.professionalReview.count({ where: { companyId } }),
      this.prisma.booking.findMany({ where: { companyId, createdAt: { gte: sixMonthsAgo } }, orderBy: { createdAt: 'asc' } }),
      this.prisma.proposal.count({ where: { companyId } }),
      this.prisma.company.findUnique({ where: { id: companyId }, select: { trustScore: true, professionalStatus: true } }),
    ]);

    const monthlyTrends = this.buildMonthlyTrends(sixMonthsAgo, now, recentBookings);

    return {
      overview: {
        reviews: totalReviews,
        inquiries: proposals,
        bookings: recentBookings.length,
        trustScore: profile?.trustScore || 0,
      },
      monthlyTrends,
    };
  }

  private async awardBookingCompletionReward(bookingId: string, clientCompanyId: string) {
    try {
      const clientOwner = await this.prisma.companyOwner.findFirst({
        where: { companyId: clientCompanyId, isPrimary: true },
      });
      if (clientOwner) {
        await this.gocashIntegration.awardBookingCompleted(bookingId, clientOwner.userId, clientCompanyId);
      } else {
        this.logger.warn(`No primary owner found for client company ${clientCompanyId}, skipping booking completion reward`);
      }
    } catch (err) {
      this.logger.warn(`Booking completion reward failed: ${(err as Error).message}`);
    }
  }

  private buildMonthlyTrends(from: Date, to: Date, bookings: { createdAt: Date }[]) {
    const months: { month: string; bookings: number }[] = [];
    const current = new Date(from);
    while (current <= to) {
      const monthKey = current.toLocaleString('en-US', { month: 'short', year: 'numeric' });
      const count = bookings.filter(
        b => new Date(b.createdAt).getMonth() === current.getMonth() && new Date(b.createdAt).getFullYear() === current.getFullYear()
      ).length;
      months.push({ month: monthKey, bookings: count });
      current.setMonth(current.getMonth() + 1);
    }
    return months;
  }

  async getSettings(companyId: string) {
    const company = await this.prisma.company.findUnique({
      where: { id: companyId },
      select: {
        email: true, mobile: true, website: true, socialLinks: true,
        businessHours: true, description: true, name: true,
      },
    });
    return {
      notifications: { emailAlerts: true, smsAlerts: false, digestEnabled: true },
      privacy: { showEmail: true, showPhone: false, allowMessages: true },
      visibility: { searchVisible: true, categoryVisible: true, featured: false },
      communication: { weeklyDigest: true, renewalReminders: true, platformUpdates: true },
      profile: company,
    };
  }

  async updateSettings(companyId: string, dto: Record<string, unknown>) {
    const allowedFields = ['notifications', 'privacy', 'visibility', 'communication'];
    const updateData: Record<string, unknown> = {};
    for (const key of allowedFields) {
      if (dto[key] !== undefined) updateData[key] = dto[key];
    }
    return updateData;
  }
}
