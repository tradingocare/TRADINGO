import { Injectable, NotFoundException, BadRequestException, ForbiddenException, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificationService } from '../notification/notification.service';
import { NotificationType, ShipmentStatus, ShipmentType as PrismaShipmentType } from '@prisma/client';
import { CreateShipmentDto, AssignCourierDto, UpdateShipmentDto, AddDocumentDto } from './dto/smart-shipment.dto';

const STATUS_FLOW: Record<ShipmentStatus, ShipmentStatus[]> = {
  PREPARING: ['PACKED'],
  PACKED: ['READY_FOR_PICKUP'],
  READY_FOR_PICKUP: ['COURIER_ASSIGNED'],
  COURIER_ASSIGNED: ['DISPATCHED'],
  DISPATCHED: ['IN_TRANSIT', 'DELIVERY_FAILED'],
  IN_TRANSIT: ['OUT_FOR_DELIVERY', 'DELIVERY_FAILED'],
  OUT_FOR_DELIVERY: ['DELIVERED', 'DELIVERY_FAILED'],
  DELIVERED: [],
  DELIVERY_FAILED: ['PREPARING'],
  RETURNED: [],
};

const STATUS_NOTIFICATION: Record<ShipmentStatus, NotificationType | null> = {
  PREPARING: null,
  PACKED: NotificationType.SHIPMENT_PACKED,
  READY_FOR_PICKUP: null,
  COURIER_ASSIGNED: NotificationType.SHIPMENT_COURIER_ASSIGNED,
  DISPATCHED: NotificationType.SHIPMENT_DISPATCHED,
  IN_TRANSIT: NotificationType.SHIPMENT_IN_TRANSIT,
  OUT_FOR_DELIVERY: NotificationType.SHIPMENT_OUT_FOR_DELIVERY,
  DELIVERED: NotificationType.SHIPMENT_DELIVERED,
  DELIVERY_FAILED: NotificationType.SHIPMENT_DELIVERY_FAILED,
  RETURNED: null,
};

@Injectable()
export class SmartShipmentService {
  private readonly logger = new Logger(SmartShipmentService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationService: NotificationService,
  ) {}

  async getUserCompany(userId: string) {
    const owner = await this.prisma.companyOwner.findFirst({
      where: { userId },
      include: { company: true },
    });
    if (!owner) throw new NotFoundException('User has no company');
    return owner.company;
  }

  private async generateShipmentNumber(): Promise<string> {
    const datePart = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const random = Math.floor(10000 + Math.random() * 90000);
    const prefix = `SHP-${datePart}-${random}`;
    const existing = await this.prisma.shipment.findUnique({ where: { shipmentNumber: prefix } });
    if (existing) return this.generateShipmentNumber();
    return prefix;
  }

  async create(userId: string, dto: CreateShipmentDto) {
    const company = await this.getUserCompany(userId);

    const order = await this.prisma.order.findUnique({
      where: { id: dto.orderId },
      include: { buyerCompany: { select: { id: true, name: true } } },
    });
    if (!order || order.deletedAt) throw new NotFoundException('Order not found');
    if (order.sellerCompanyId !== company.id) throw new ForbiddenException('Only the seller can create shipments');

    const validStatuses: string[] = ['CONFIRMED', 'PROCESSING', 'PACKED', 'READY_FOR_DISPATCH', 'DISPATCHED', 'IN_TRANSIT'];
    if (!validStatuses.includes(order.status)) {
      throw new BadRequestException(`Cannot create shipment for order in ${order.status} status`);
    }

    const shipment = await this.prisma.$transaction(async (tx) => {
      const created = await tx.shipment.create({
        data: {
          shipmentNumber: await this.generateShipmentNumber(),
          orderId: dto.orderId,
          purchaseOrderId: dto.purchaseOrderId ?? order.purchaseOrderId,
          type: (dto.type as PrismaShipmentType) ?? 'STANDARD',
          status: 'PREPARING',
          statusChangedBy: userId,
          buyerCompanyId: order.buyerCompanyId,
          sellerCompanyId: company.id,
          weight: dto.weight ?? null,
          totalPackages: dto.totalPackages ?? 1,
          deliveryAddress: dto.deliveryAddress as any ?? undefined,
          pickupAddress: dto.pickupAddress as any ?? undefined,
          specialInstructions: dto.specialInstructions ?? null,
          buyerNotes: dto.buyerNotes ?? null,
          createdBy: userId,
          updatedBy: userId,
          packages: dto.packages?.length
            ? { create: dto.packages.map((pkg, i) => ({
                label: pkg.label ?? `Package ${i + 1}`,
                weight: pkg.weight ?? null,
                weightUnit: pkg.weightUnit ?? 'kg',
                length: pkg.length ?? null,
                width: pkg.width ?? null,
                height: pkg.height ?? null,
                contents: pkg.contents ?? null,
                declaredValue: pkg.declaredValue ?? null,
                sortOrder: i,
              })) }
            : undefined,
        },
        include: { packages: true },
      });

      await tx.shipmentTimelineEvent.create({
        data: {
          shipmentId: created.id,
          toStatus: 'PREPARING',
          changedBy: userId,
          changedByRole: 'SELLER',
          note: 'Shipment created',
        },
      });

      return created;
    });

    try {
      await this.notificationService.createWithTemplate(
        order.buyerCompanyId, undefined,
        NotificationType.SHIPMENT_CREATED,
        { shipmentNumber: shipment.shipmentNumber, orderNumber: order.orderNumber, createdById: userId },
      );
    } catch (err) {
      this.logger.warn(`Failed to notify buyer: ${(err as Error).message}`);
    }

    return shipment;
  }

  async assignCourier(userId: string, shipmentId: string, dto: AssignCourierDto) {
    const company = await this.getUserCompany(userId);
    const shipment = await this.prisma.shipment.findUnique({ where: { id: shipmentId } });
    if (!shipment || shipment.deletedAt) throw new NotFoundException('Shipment not found');
    if (shipment.sellerCompanyId !== company.id) throw new ForbiddenException('Only the seller can assign courier');
    if (!['PREPARING', 'PACKED', 'READY_FOR_PICKUP'].includes(shipment.status)) {
      throw new BadRequestException('Shipment must be in PREPARING, PACKED, or READY_FOR_PICKUP status');
    }

    const provider = await this.prisma.courierProvider.findUnique({ where: { id: dto.courierProviderId } });
    if (!provider || !provider.isActive) throw new NotFoundException('Courier provider not found or inactive');

    const existingTracking = await this.prisma.shipment.findUnique({ where: { trackingNumber: dto.trackingNumber } });
    if (existingTracking && existingTracking.id !== shipmentId) {
      throw new BadRequestException('Tracking number already in use');
    }

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.shipment.update({
        where: { id: shipmentId },
        data: {
          courierProviderId: dto.courierProviderId,
          trackingNumber: dto.trackingNumber,
          courierDetails: dto.courierDetails as any ?? undefined,
          estimatedDeliveryDate: dto.estimatedDeliveryDate ? new Date(dto.estimatedDeliveryDate) : null,
          status: 'COURIER_ASSIGNED',
          statusChangedAt: new Date(),
          statusChangedBy: userId,
          updatedBy: userId,
        },
      });

      await tx.shipmentTimelineEvent.create({
        data: {
          shipmentId,
          fromStatus: shipment.status as ShipmentStatus,
          toStatus: 'COURIER_ASSIGNED',
          changedBy: userId,
          changedByRole: 'SELLER',
          note: `Courier assigned: ${provider.name} (${dto.trackingNumber})`,
        },
      });

      try {
        await this.notificationService.createWithTemplate(
          shipment.buyerCompanyId, undefined,
          NotificationType.SHIPMENT_COURIER_ASSIGNED,
          { shipmentNumber: shipment.shipmentNumber, trackingNumber: dto.trackingNumber, courier: provider.name, createdById: userId },
        );
      } catch (err) {
        this.logger.warn(`Failed to notify: ${(err as Error).message}`);
      }

      return updated;
    });
  }

  async updateStatus(userId: string, shipmentId: string, newStatus: ShipmentStatus, note?: string, location?: string) {
    const company = await this.getUserCompany(userId);
    const shipment = await this.prisma.shipment.findUnique({
      where: { id: shipmentId },
      include: { order: { select: { orderNumber: true } } },
    });
    if (!shipment || shipment.deletedAt) throw new NotFoundException('Shipment not found');

    const isSeller = shipment.sellerCompanyId === company.id;
    const isBuyer = shipment.buyerCompanyId === company.id;
    if (!isSeller && !isBuyer) throw new ForbiddenException('Access denied');

    const allowedTransitions = STATUS_FLOW[shipment.status as ShipmentStatus];
    if (!allowedTransitions || !allowedTransitions.includes(newStatus)) {
      throw new BadRequestException(`Cannot transition from ${shipment.status} to ${newStatus}`);
    }

    if (newStatus === 'DELIVERED' && !isBuyer) {
      throw new ForbiddenException('Only buyer can confirm delivery');
    }

    const changedByRole = isSeller ? 'SELLER' : 'BUYER';

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.shipment.update({
        where: { id: shipmentId },
        data: {
          status: newStatus,
          statusChangedAt: new Date(),
          statusChangedBy: userId,
          deliveredAt: newStatus === 'DELIVERED' ? new Date() : undefined,
          updatedBy: userId,
        },
      });

      await tx.shipmentTimelineEvent.create({
        data: {
          shipmentId,
          fromStatus: shipment.status as ShipmentStatus,
          toStatus: newStatus,
          changedBy: userId,
          changedByRole,
          location: location ?? null,
          note: note ?? null,
        },
      });

      const notifyType = STATUS_NOTIFICATION[newStatus];
      if (notifyType) {
        try {
          const notifyCompanyId = isSeller ? shipment.buyerCompanyId : shipment.sellerCompanyId;
          await this.notificationService.createWithTemplate(
            notifyCompanyId, undefined,
            notifyType,
            { shipmentNumber: shipment.shipmentNumber, orderNumber: shipment.order.orderNumber, createdById: userId, note, location },
          );
        } catch (err) {
          this.logger.warn(`Failed to send notification: ${(err as Error).message}`);
        }
      }

      return updated;
    });
  }

  async findByBuyer(userId: string, status?: string, page = 1, limit = 20) {
    const company = await this.getUserCompany(userId);
    const where: any = { buyerCompanyId: company.id, deletedAt: null };
    if (status) where.status = status;

    const [data, total] = await Promise.all([
      this.prisma.shipment.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          courierProvider: { select: { id: true, name: true, slug: true, trackingUrl: true } },
          order: { select: { id: true, orderNumber: true } },
          _count: { select: { packages: true, documents: true } },
        },
      }),
      this.prisma.shipment.count({ where }),
    ]);
    return { data, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }

  async findBySeller(userId: string, status?: string, page = 1, limit = 20) {
    const company = await this.getUserCompany(userId);
    const where: any = { sellerCompanyId: company.id, deletedAt: null };
    if (status) where.status = status;

    const [data, total] = await Promise.all([
      this.prisma.shipment.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          courierProvider: { select: { id: true, name: true, slug: true, trackingUrl: true } },
          order: { select: { id: true, orderNumber: true } },
          _count: { select: { packages: true, documents: true } },
        },
      }),
      this.prisma.shipment.count({ where }),
    ]);
    return { data, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }

  async findById(userId: string, shipmentId: string) {
    const company = await this.getUserCompany(userId);
    const shipment = await this.prisma.shipment.findUnique({
      where: { id: shipmentId },
      include: {
        packages: { orderBy: { sortOrder: 'asc' } },
        timeline: { orderBy: { createdAt: 'asc' } },
        documents: { orderBy: { createdAt: 'desc' } },
        courierProvider: { select: { id: true, name: true, slug: true, trackingUrl: true, apiProvider: true } },
        order: { select: { id: true, orderNumber: true, status: true, totalAmount: true, currency: true } },
        buyerCompany: { select: { id: true, name: true, slug: true, logo: true } },
        sellerCompany: { select: { id: true, name: true, slug: true, logo: true } },
      },
    });
    if (!shipment || shipment.deletedAt) throw new NotFoundException('Shipment not found');
    if (shipment.buyerCompanyId !== company.id && shipment.sellerCompanyId !== company.id) {
      throw new ForbiddenException('Access denied');
    }
    return shipment;
  }

  async updateShipment(userId: string, shipmentId: string, dto: UpdateShipmentDto) {
    const company = await this.getUserCompany(userId);
    const shipment = await this.prisma.shipment.findUnique({ where: { id: shipmentId } });
    if (!shipment || shipment.deletedAt) throw new NotFoundException('Shipment not found');
    if (shipment.sellerCompanyId !== company.id) throw new ForbiddenException('Only seller can update shipment');

    return this.prisma.shipment.update({
      where: { id: shipmentId },
      data: {
        weight: dto.weight ?? undefined,
        totalPackages: dto.totalPackages ?? undefined,
        estimatedDeliveryDate: dto.estimatedDeliveryDate ? new Date(dto.estimatedDeliveryDate) : undefined,
        specialInstructions: dto.specialInstructions ?? undefined,
        sellerNotes: dto.sellerNotes ?? undefined,
        updatedBy: userId,
      },
    });
  }

  async getTimeline(userId: string, shipmentId: string) {
    const company = await this.getUserCompany(userId);
    const shipment = await this.prisma.shipment.findUnique({ where: { id: shipmentId }, select: { buyerCompanyId: true, sellerCompanyId: true, deletedAt: true } });
    if (!shipment || shipment.deletedAt) throw new NotFoundException('Shipment not found');
    if (shipment.buyerCompanyId !== company.id && shipment.sellerCompanyId !== company.id) throw new ForbiddenException('Access denied');

    return this.prisma.shipmentTimelineEvent.findMany({
      where: { shipmentId },
      orderBy: { createdAt: 'asc' },
    });
  }

  async addDocument(userId: string, shipmentId: string, dto: AddDocumentDto) {
    const company = await this.getUserCompany(userId);
    const shipment = await this.prisma.shipment.findUnique({ where: { id: shipmentId }, select: { sellerCompanyId: true, deletedAt: true } });
    if (!shipment || shipment.deletedAt) throw new NotFoundException('Shipment not found');
    if (shipment.sellerCompanyId !== company.id) throw new ForbiddenException('Only seller can upload documents');

    return this.prisma.shipmentDocument.create({
      data: {
        shipmentId,
        docType: dto.docType,
        fileName: dto.fileName,
        fileUrl: dto.fileUrl,
        mimeType: dto.mimeType ?? null,
        fileSize: dto.fileSize ?? null,
        uploadedBy: userId,
      },
    });
  }

  async getDocuments(userId: string, shipmentId: string) {
    const company = await this.getUserCompany(userId);
    const shipment = await this.prisma.shipment.findUnique({ where: { id: shipmentId }, select: { buyerCompanyId: true, sellerCompanyId: true, deletedAt: true } });
    if (!shipment || shipment.deletedAt) throw new NotFoundException('Shipment not found');
    if (shipment.buyerCompanyId !== company.id && shipment.sellerCompanyId !== company.id) throw new ForbiddenException('Access denied');

    return this.prisma.shipmentDocument.findMany({
      where: { shipmentId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getCourierProviders() {
    return this.prisma.courierProvider.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
      select: { id: true, name: true, slug: true, trackingUrl: true },
    });
  }

  // ─── PERFORMANCE METRICS ─────────────────────────────────────

  async getPerformanceMetrics(companyId: string, startDate?: string, endDate?: string) {
    const dateFilter: any = {};
    if (startDate) dateFilter.gte = new Date(startDate);
    if (endDate) dateFilter.lte = new Date(endDate);
    const where: any = { OR: [{ buyerCompanyId: companyId }, { sellerCompanyId: companyId }], deletedAt: null };
    if (startDate || endDate) where.createdAt = dateFilter;

    const [total, byStatus, delivered, deliveryFailed] = await Promise.all([
      this.prisma.shipment.count({ where }),
      this.prisma.shipment.groupBy({ by: ['status'], _count: true, where }),
      this.prisma.shipment.findMany({
        where: { ...where, status: 'DELIVERED' },
        select: { id: true, createdAt: true, deliveredAt: true, estimatedDeliveryDate: true },
      }),
      this.prisma.shipment.count({ where: { ...where, status: 'DELIVERY_FAILED' } }),
    ]);

    let onTimeCount = 0;
    let totalTransitHours = 0;
    let transitCount = 0;

    for (const s of delivered) {
      if (s.deliveredAt) {
        const hrs = (s.deliveredAt.getTime() - s.createdAt.getTime()) / 3600000;
        totalTransitHours += hrs;
        transitCount++;
        if (s.estimatedDeliveryDate && s.deliveredAt <= s.estimatedDeliveryDate) {
          onTimeCount++;
        }
      }
    }

    return {
      totalShipments: total,
      byStatus: Object.fromEntries(byStatus.map(s => [s.status, s._count])),
      onTimeDeliveryRate: delivered.length > 0 ? Math.round((onTimeCount / delivered.length) * 10000) / 100 : 0,
      avgTransitTimeHours: transitCount > 0 ? Math.round((totalTransitHours / transitCount) * 100) / 100 : 0,
      deliveryFailureRate: total > 0 ? Math.round((deliveryFailed / total) * 10000) / 100 : 0,
      totalDelivered: delivered.length,
    };
  }

  async getDeliveryMetrics(companyId: string, startDate?: string, endDate?: string) {
    const dateFilter: any = {};
    if (startDate) dateFilter.gte = new Date(startDate);
    if (endDate) dateFilter.lte = new Date(endDate);
    const where: any = { OR: [{ buyerCompanyId: companyId }, { sellerCompanyId: companyId }], deletedAt: null };
    if (startDate || endDate) where.createdAt = dateFilter;

    const [total, confirmed, failed, delivered] = await Promise.all([
      this.prisma.shipment.count({ where }),
      this.prisma.shipment.count({ where: { ...where, status: 'DELIVERED' } }),
      this.prisma.shipment.count({ where: { ...where, status: { in: ['DELIVERY_FAILED'] } } }),
      this.prisma.shipment.findMany({
        where: { ...where, status: 'DELIVERED', deliveredAt: { not: null } },
        select: { deliveredAt: true, createdAt: true },
      }),
    ]);

    let totalDeliveryHours = 0;
    for (const s of delivered) {
      if (s.deliveredAt) {
        totalDeliveryHours += (s.deliveredAt.getTime() - s.createdAt.getTime()) / 3600000;
      }
    }

    return {
      totalShipments: total,
      deliveryConfirmationRate: total > 0 ? Math.round((confirmed / total) * 10000) / 100 : 0,
      deliveryFailureRate: total > 0 ? Math.round((failed / total) * 10000) / 100 : 0,
      avgDeliveryTimeHours: delivered.length > 0 ? Math.round((totalDeliveryHours / delivered.length) * 100) / 100 : 0,
      totalDelivered: confirmed,
      totalFailed: failed,
    };
  }

  // ─── ADMIN ─────────────────────────────────────────────────────────

  async getAdminAnalytics() {
    const [totalShipments, byStatus, byCourier, delayedShipments, recentShipments] = await Promise.all([
      this.prisma.shipment.count({ where: { deletedAt: null } }),
      this.prisma.shipment.groupBy({ by: ['status'], _count: { id: true }, where: { deletedAt: null } }),
      this.prisma.shipment.groupBy({ by: ['courierProviderId'], _count: { id: true }, where: { deletedAt: null, courierProviderId: { not: null } } }),
      this.prisma.shipment.findMany({
        where: { deletedAt: null, status: { in: ['DELIVERY_FAILED'] } },
        orderBy: { updatedAt: 'desc' },
        take: 20,
      }),
      this.prisma.shipment.findMany({
        where: { deletedAt: null },
        orderBy: { createdAt: 'desc' },
        take: 50,
        include: {
          courierProvider: { select: { id: true, name: true } },
          order: { select: { orderNumber: true } },
        },
      }),
    ]);

    return { totalShipments, byStatus, byCourier, delayedShipments, recentShipments };
  }

  async adminFindAll(page = 1, limit = 50, status?: string) {
    const where: any = { deletedAt: null };
    if (status) where.status = status;
    const [data, total] = await Promise.all([
      this.prisma.shipment.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          courierProvider: { select: { id: true, name: true } },
          order: { select: { id: true, orderNumber: true } },
          buyerCompany: { select: { id: true, name: true } },
          sellerCompany: { select: { id: true, name: true } },
        },
      }),
      this.prisma.shipment.count({ where }),
    ]);
    return { data, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }

  async adminFindById(shipmentId: string) {
    const shipment = await this.prisma.shipment.findUnique({
      where: { id: shipmentId },
      include: {
        packages: { orderBy: { sortOrder: 'asc' } },
        timeline: { orderBy: { createdAt: 'asc' } },
        documents: { orderBy: { createdAt: 'desc' } },
        courierProvider: { select: { id: true, name: true, slug: true, trackingUrl: true, apiProvider: true } },
        order: { select: { id: true, orderNumber: true, status: true, totalAmount: true, currency: true } },
        buyerCompany: { select: { id: true, name: true, slug: true } },
        sellerCompany: { select: { id: true, name: true, slug: true } },
      },
    });
    if (!shipment || shipment.deletedAt) throw new NotFoundException('Shipment not found');
    return shipment;
  }

  async seedCourierProviders() {
    const existing = await this.prisma.courierProvider.count();
    if (existing > 0) return { message: 'Courier providers already seeded', count: existing };

    const providers = [
      { name: 'Delhivery', slug: 'delhivery', apiProvider: 'delhivery', trackingUrl: 'https://www.delhivery.com/track/package/{tracking}', isActive: true, sortOrder: 1 },
      { name: 'Blue Dart', slug: 'blue-dart', apiProvider: 'bluedart', trackingUrl: 'https://www.bluedart.com/tracking/?id={tracking}', isActive: true, sortOrder: 2 },
      { name: 'DTDC', slug: 'dtdc', apiProvider: 'dtdc', trackingUrl: 'https://www.dtdc.in/tracking/track.asp?trackid={tracking}', isActive: true, sortOrder: 3 },
      { name: 'India Post', slug: 'india-post', apiProvider: 'indiapost', trackingUrl: 'https://www.indiapost.gov.in/_layouts/15/dop.portal.tracking/trackconsignment.aspx', isActive: true, sortOrder: 4 },
      { name: 'DHL', slug: 'dhl', apiProvider: 'dhl', trackingUrl: 'https://www.dhl.com/in-en/home/tracking/tracking-express.html?submit=1&tracking-id={tracking}', isActive: true, sortOrder: 5 },
      { name: 'FedEx', slug: 'fedex', apiProvider: 'fedex', trackingUrl: 'https://www.fedex.com/fedextrack/?trknbr={tracking}', isActive: true, sortOrder: 6 },
      { name: 'UPS', slug: 'ups', apiProvider: 'ups', trackingUrl: 'https://www.ups.com/track?tracknum={tracking}', isActive: true, sortOrder: 7 },
      { name: 'Shiprocket', slug: 'shiprocket', apiProvider: 'shiprocket', trackingUrl: null, isActive: true, sortOrder: 8 },
      { name: 'Ecom Express', slug: 'ecom-express', apiProvider: 'ecomexpress', trackingUrl: null, isActive: true, sortOrder: 9 },
      { name: 'XpressBees', slug: 'xpressbees', apiProvider: 'xpressbees', trackingUrl: null, isActive: true, sortOrder: 10 },
      { name: 'Shadowfax', slug: 'shadowfax', apiProvider: 'shadowfax', trackingUrl: null, isActive: true, sortOrder: 11 },
      { name: 'Pickrr', slug: 'pickrr', apiProvider: 'pickrr', trackingUrl: null, isActive: true, sortOrder: 12 },
    ];

    await this.prisma.courierProvider.createMany({ data: providers });
    return { message: 'Courier providers seeded', count: providers.length };
  }
}
