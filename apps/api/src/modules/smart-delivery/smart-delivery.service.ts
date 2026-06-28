import { Injectable, NotFoundException, BadRequestException, ForbiddenException, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificationService } from '../notification/notification.service';
import { NotificationType, DeliveryStatus, ShipmentStatus } from '@prisma/client';
import { CreateDeliveryDto, ConfirmDeliveryDto, RejectDeliveryDto, AddDeliveryDocumentDto } from './dto/smart-delivery.dto';

const STATUS_FLOW: Record<DeliveryStatus, DeliveryStatus[]> = {
  OUT_FOR_DELIVERY: ['DELIVERED', 'DELIVERY_FAILED'],
  DELIVERED: ['DELIVERY_CONFIRMED', 'DELIVERY_FAILED', 'REJECTED'],
  DELIVERY_CONFIRMED: ['COMPLETED', 'REJECTED'],
  DELIVERY_FAILED: ['OUT_FOR_DELIVERY'],
  PARTIALLY_DELIVERED: ['DELIVERED', 'DELIVERY_CONFIRMED', 'DELIVERY_FAILED'],
  REJECTED: ['DELIVERED'],
  RETURNED: [],
  COMPLETED: [],
};

const STATUS_NOTIFICATION: Record<DeliveryStatus, NotificationType | null> = {
  OUT_FOR_DELIVERY: NotificationType.DELIVERY_OUT_FOR_DELIVERY,
  DELIVERED: NotificationType.DELIVERY_DELIVERED,
  DELIVERY_CONFIRMED: NotificationType.DELIVERY_CONFIRMED,
  DELIVERY_FAILED: NotificationType.DELIVERY_FAILED,
  PARTIALLY_DELIVERED: null,
  REJECTED: NotificationType.DELIVERY_FAILED,
  RETURNED: null,
  COMPLETED: NotificationType.DELIVERY_COMPLETED,
};

@Injectable()
export class SmartDeliveryService {
  private readonly logger = new Logger(SmartDeliveryService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationService: NotificationService,
  ) {}

  private async getUserCompany(userId: string) {
    const owner = await this.prisma.companyOwner.findFirst({
      where: { userId },
      include: { company: true },
    });
    if (!owner) throw new NotFoundException('User has no company');
    return owner.company;
  }

  private async generateDeliveryNumber(): Promise<string> {
    const datePart = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const random = Math.floor(10000 + Math.random() * 90000);
    const prefix = `DEL-${datePart}-${random}`;
    const existing = await this.prisma.delivery.findUnique({ where: { deliveryNumber: prefix } });
    if (existing) return this.generateDeliveryNumber();
    return prefix;
  }

  async createFromShipment(userId: string, dto: CreateDeliveryDto) {
    const company = await this.getUserCompany(userId);

    const shipment = await this.prisma.shipment.findUnique({
      where: { id: dto.shipmentId },
      include: { order: { select: { id: true, orderNumber: true } } },
    });
    if (!shipment || shipment.deletedAt) throw new NotFoundException('Shipment not found');
    if (shipment.sellerCompanyId !== company.id) throw new ForbiddenException('Only the seller can create deliveries');

    if (shipment.status !== ('OUT_FOR_DELIVERY' as ShipmentStatus)) {
      throw new BadRequestException('Shipment must be OUT_FOR_DELIVERY to create a delivery');
    }

    const existing = await this.prisma.delivery.findUnique({ where: { shipmentId: dto.shipmentId } });
    if (existing) throw new BadRequestException('Delivery already exists for this shipment');

    return this.prisma.$transaction(async (tx) => {
      const delivery = await tx.delivery.create({
        data: {
          deliveryNumber: await this.generateDeliveryNumber(),
          shipmentId: dto.shipmentId,
          orderId: shipment.orderId,
          status: 'OUT_FOR_DELIVERY',
          statusChangedBy: userId,
          receiverName: dto.receiverName ?? null,
          receiverMobile: dto.receiverMobile ?? null,
          courierNotes: dto.courierNotes ?? null,
          buyerNotes: dto.buyerNotes ?? null,
          buyerCompanyId: shipment.buyerCompanyId,
          sellerCompanyId: company.id,
          createdBy: userId,
          updatedBy: userId,
        },
      });

      await tx.deliveryTimelineEvent.create({
        data: {
          deliveryId: delivery.id,
          toStatus: 'OUT_FOR_DELIVERY',
          changedBy: userId,
          changedByRole: 'SELLER',
          note: 'Delivery initiated from shipment',
        },
      });

      return delivery;
    });
  }

  async confirmDelivery(userId: string, deliveryId: string, dto: ConfirmDeliveryDto) {
    const company = await this.getUserCompany(userId);
    const delivery = await this.prisma.delivery.findUnique({ where: { id: deliveryId } });
    if (!delivery || delivery.deletedAt) throw new NotFoundException('Delivery not found');
    if (delivery.buyerCompanyId !== company.id) throw new ForbiddenException('Only the buyer can confirm delivery');

    if (delivery.status !== 'DELIVERED') {
      throw new BadRequestException('Delivery must be in DELIVERED status to confirm');
    }

    return this.prisma.$transaction(async (tx) => {
      const confirmed = await tx.delivery.update({
        where: { id: deliveryId },
        data: {
          status: 'DELIVERY_CONFIRMED',
          statusChangedAt: new Date(),
          statusChangedBy: userId,
          confirmedAt: new Date(),
          receiverName: dto.receiverName ?? delivery.receiverName,
          receiverMobile: dto.receiverMobile ?? delivery.receiverMobile,
          updatedBy: userId,
        },
      });

      let podId: string | undefined;
      if (dto.receiverName || dto.receiverMobile || dto.digitalSignatureUrl || dto.photoUrls || dto.geoLatitude) {
        const pod = await tx.proofOfDelivery.create({
          data: {
            deliveryId,
            receiverName: dto.receiverName ?? null,
            receiverMobile: dto.receiverMobile ?? null,
            otpVerified: dto.otpVerified ?? false,
            digitalSignatureUrl: dto.digitalSignatureUrl ?? null,
            photoUrls: dto.photoUrls ? JSON.parse(dto.photoUrls) as any : null,
            geoLatitude: dto.geoLatitude ?? null,
            geoLongitude: dto.geoLongitude ?? null,
            courierNotes: dto.courierNotes ?? null,
            buyerNotes: dto.buyerNotes ?? null,
            deliveredAt: new Date(),
            confirmedAt: new Date(),
          },
        });
        podId = pod.id;
      }

      await tx.deliveryTimelineEvent.create({
        data: {
          deliveryId,
          fromStatus: 'DELIVERED',
          toStatus: 'DELIVERY_CONFIRMED',
          changedBy: userId,
          changedByRole: 'BUYER',
          note: `Delivery confirmed by buyer${podId ? ' with POD' : ''}`,
        },
      });

      try {
        await this.notificationService.createWithTemplate(
          delivery.sellerCompanyId, undefined,
          NotificationType.DELIVERY_CONFIRMED,
          { deliveryNumber: delivery.deliveryNumber, createdById: userId },
        );
      } catch (err) {
        this.logger.warn(`Notification failed: ${(err as Error).message}`);
      }

      return confirmed;
    });
  }

  async rejectDelivery(userId: string, deliveryId: string, dto: RejectDeliveryDto) {
    const company = await this.getUserCompany(userId);
    const delivery = await this.prisma.delivery.findUnique({ where: { id: deliveryId } });
    if (!delivery || delivery.deletedAt) throw new NotFoundException('Delivery not found');
    if (delivery.buyerCompanyId !== company.id) throw new ForbiddenException('Only the buyer can reject delivery');

    if (!['DELIVERED', 'DELIVERY_CONFIRMED'].includes(delivery.status)) {
      throw new BadRequestException('Can only reject a DELIVERED or DELIVERY_CONFIRMED delivery');
    }

    return this.prisma.$transaction(async (tx) => {
      const rejected = await tx.delivery.update({
        where: { id: deliveryId },
        data: {
          status: 'REJECTED',
          statusChangedAt: new Date(),
          statusChangedBy: userId,
          rejectionReason: dto.reason,
          rejectionNote: dto.note ?? null,
          updatedBy: userId,
        },
      });

      await tx.deliveryTimelineEvent.create({
        data: {
          deliveryId,
          fromStatus: delivery.status as DeliveryStatus,
          toStatus: 'REJECTED',
          changedBy: userId,
          changedByRole: 'BUYER',
          note: `Rejected: ${dto.reason}${dto.note ? ` — ${dto.note}` : ''}`,
        },
      });

      return rejected;
    });
  }

  async updateStatus(userId: string, deliveryId: string, newStatus: DeliveryStatus, note?: string) {
    const company = await this.getUserCompany(userId);
    const delivery = await this.prisma.delivery.findUnique({ where: { id: deliveryId } });
    if (!delivery || delivery.deletedAt) throw new NotFoundException('Delivery not found');

    const isSeller = delivery.sellerCompanyId === company.id;
    const isBuyer = delivery.buyerCompanyId === company.id;
    if (!isSeller && !isBuyer) throw new ForbiddenException('Access denied');

    const allowedTransitions = STATUS_FLOW[delivery.status as DeliveryStatus];
    if (!allowedTransitions || !allowedTransitions.includes(newStatus)) {
      throw new BadRequestException(`Cannot transition from ${delivery.status} to ${newStatus}`);
    }

    if (newStatus === 'DELIVERED' && !isSeller) {
      throw new ForbiddenException('Only seller can mark as delivered');
    }
    if (newStatus === 'DELIVERY_CONFIRMED' && !isBuyer) {
      throw new ForbiddenException('Only buyer can confirm delivery');
    }
    if (newStatus === 'REJECTED' && !isBuyer) {
      throw new ForbiddenException('Only buyer can reject delivery');
    }

    const changedByRole = isSeller ? 'SELLER' : 'BUYER';

    return this.prisma.$transaction(async (tx) => {
      const updateData: any = {
        status: newStatus,
        statusChangedAt: new Date(),
        statusChangedBy: userId,
        updatedBy: userId,
      };
      if (newStatus === 'DELIVERED') updateData.deliveredAt = new Date();
      if (newStatus === 'COMPLETED') updateData.completedAt = new Date();

      const updated = await tx.delivery.update({ where: { id: deliveryId }, data: updateData });

      await tx.deliveryTimelineEvent.create({
        data: {
          deliveryId,
          fromStatus: delivery.status as DeliveryStatus,
          toStatus: newStatus,
          changedBy: userId,
          changedByRole,
          note: note ?? null,
        },
      });

      const notifyType = STATUS_NOTIFICATION[newStatus];
      if (notifyType) {
        try {
          const notifyCompanyId = isSeller ? delivery.buyerCompanyId : delivery.sellerCompanyId;
          await this.notificationService.createWithTemplate(notifyCompanyId, undefined, notifyType, { deliveryNumber: delivery.deliveryNumber, createdById: userId });
        } catch (err) {
          this.logger.warn(`Notification failed: ${(err as Error).message}`);
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
      this.prisma.delivery.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          shipment: { select: { id: true, shipmentNumber: true, trackingNumber: true } },
          order: { select: { id: true, orderNumber: true } },
          proofOfDelivery: { select: { id: true, receiverName: true, deliveredAt: true, confirmedAt: true } },
          _count: { select: { documents: true } },
        },
      }),
      this.prisma.delivery.count({ where }),
    ]);
    return { data, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }

  async findBySeller(userId: string, status?: string, page = 1, limit = 20) {
    const company = await this.getUserCompany(userId);
    const where: any = { sellerCompanyId: company.id, deletedAt: null };
    if (status) where.status = status;

    const [data, total] = await Promise.all([
      this.prisma.delivery.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          shipment: { select: { id: true, shipmentNumber: true, trackingNumber: true } },
          order: { select: { id: true, orderNumber: true } },
          proofOfDelivery: { select: { id: true, receiverName: true, deliveredAt: true } },
          _count: { select: { documents: true } },
        },
      }),
      this.prisma.delivery.count({ where }),
    ]);
    return { data, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }

  async findById(userId: string, deliveryId: string) {
    const company = await this.getUserCompany(userId);
    const delivery = await this.prisma.delivery.findUnique({
      where: { id: deliveryId },
      include: {
        shipment: {
          select: { id: true, shipmentNumber: true, trackingNumber: true, courierProvider: { select: { name: true } } },
        },
        order: { select: { id: true, orderNumber: true, totalAmount: true, currency: true } },
        proofOfDelivery: true,
        timeline: { orderBy: { createdAt: 'asc' } },
        documents: { orderBy: { createdAt: 'desc' } },
        buyerCompany: { select: { id: true, name: true, logo: true } },
        sellerCompany: { select: { id: true, name: true, logo: true } },
      },
    });
    if (!delivery || delivery.deletedAt) throw new NotFoundException('Delivery not found');
    if (delivery.buyerCompanyId !== company.id && delivery.sellerCompanyId !== company.id) {
      throw new ForbiddenException('Access denied');
    }
    return delivery;
  }

  async getTimeline(userId: string, deliveryId: string) {
    const company = await this.getUserCompany(userId);
    const delivery = await this.prisma.delivery.findUnique({ where: { id: deliveryId }, select: { buyerCompanyId: true, sellerCompanyId: true, deletedAt: true } });
    if (!delivery || delivery.deletedAt) throw new NotFoundException('Delivery not found');
    if (delivery.buyerCompanyId !== company.id && delivery.sellerCompanyId !== company.id) throw new ForbiddenException('Access denied');

    return this.prisma.deliveryTimelineEvent.findMany({
      where: { deliveryId },
      orderBy: { createdAt: 'asc' },
    });
  }

  async addDocument(userId: string, deliveryId: string, dto: AddDeliveryDocumentDto) {
    const company = await this.getUserCompany(userId);
    const delivery = await this.prisma.delivery.findUnique({ where: { id: deliveryId }, select: { sellerCompanyId: true, deletedAt: true } });
    if (!delivery || delivery.deletedAt) throw new NotFoundException('Delivery not found');
    if (delivery.sellerCompanyId !== company.id) throw new ForbiddenException('Only seller can upload documents');

    return this.prisma.deliveryDocument.create({
      data: {
        deliveryId,
        docType: dto.docType,
        fileName: dto.fileName,
        fileUrl: dto.fileUrl,
        mimeType: dto.mimeType ?? null,
        fileSize: dto.fileSize ?? null,
        uploadedBy: userId,
      },
    });
  }

  async getDocuments(userId: string, deliveryId: string) {
    const company = await this.getUserCompany(userId);
    const delivery = await this.prisma.delivery.findUnique({ where: { id: deliveryId }, select: { buyerCompanyId: true, sellerCompanyId: true, deletedAt: true } });
    if (!delivery || delivery.deletedAt) throw new NotFoundException('Delivery not found');
    if (delivery.buyerCompanyId !== company.id && delivery.sellerCompanyId !== company.id) throw new ForbiddenException('Access denied');

    return this.prisma.deliveryDocument.findMany({
      where: { deliveryId },
      orderBy: { createdAt: 'desc' },
    });
  }

  // ─── ADMIN ─────────────────────────────────────────────────────────

  async getAdminAnalytics() {
    const [total, byStatus, pendingConfirmation, failedDeliveries, recent] = await Promise.all([
      this.prisma.delivery.count({ where: { deletedAt: null } }),
      this.prisma.delivery.groupBy({ by: ['status'], _count: { id: true }, where: { deletedAt: null } }),
      this.prisma.delivery.count({ where: { status: 'DELIVERED', deletedAt: null } }),
      this.prisma.delivery.findMany({ where: { status: 'DELIVERY_FAILED', deletedAt: null }, orderBy: { updatedAt: 'desc' }, take: 20 }),
      this.prisma.delivery.findMany({ where: { deletedAt: null }, orderBy: { createdAt: 'desc' }, take: 50, include: { order: { select: { orderNumber: true } }, buyerCompany: { select: { name: true } } } }),
    ]);
    return { total, byStatus, pendingConfirmation, failedDeliveries, recent };
  }

  async adminFindAll(page = 1, limit = 50, status?: string) {
    const where: any = { deletedAt: null };
    if (status) where.status = status;
    const [data, total] = await Promise.all([
      this.prisma.delivery.findMany({
        where, orderBy: { createdAt: 'desc' }, skip: (page - 1) * limit, take: limit,
        include: {
          order: { select: { orderNumber: true } },
          buyerCompany: { select: { name: true } },
          sellerCompany: { select: { name: true } },
          proofOfDelivery: { select: { id: true, receiverName: true } },
        },
      }),
      this.prisma.delivery.count({ where }),
    ]);
    return { data, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }

  async adminFindById(deliveryId: string) {
    const delivery = await this.prisma.delivery.findUnique({
      where: { id: deliveryId },
      include: {
        shipment: { select: { id: true, shipmentNumber: true, trackingNumber: true } },
        order: { select: { id: true, orderNumber: true, totalAmount: true, currency: true } },
        proofOfDelivery: true,
        timeline: { orderBy: { createdAt: 'asc' } },
        documents: true,
        buyerCompany: { select: { id: true, name: true } },
        sellerCompany: { select: { id: true, name: true } },
      },
    });
    if (!delivery || delivery.deletedAt) throw new NotFoundException('Delivery not found');
    return delivery;
  }
}
