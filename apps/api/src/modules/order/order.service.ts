import { Injectable, NotFoundException, BadRequestException, ForbiddenException, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { OrderNumberService } from './order-number.service';
import { OrderTimelineService } from './order-timeline.service';
import { OrderDocumentService } from './order-document.service';
import { OrderAnalyticsService } from './order-analytics.service';
import { ChatService } from '../chat/chat.service';
import { NotificationService } from '../notification/notification.service';
import { CreateOrderDto, UpdateOrderDto, CancelOrderDto, CreateReturnDto, ReviewReturnDto, CreateOrderDocumentDto } from './dto/order.dto';
import { NotificationType, OrderStatus } from '@prisma/client';

const STATUS_FLOW: Record<OrderStatus, OrderStatus[]> = {
  PENDING: ['CONFIRMED', 'CANCELLED'],
  CONFIRMED: ['PROCESSING', 'CANCELLED'],
  PROCESSING: ['PACKED', 'CANCELLED'],
  PACKED: ['READY_FOR_DISPATCH', 'CANCELLED'],
  READY_FOR_DISPATCH: ['DISPATCHED', 'CANCELLED'],
  DISPATCHED: ['IN_TRANSIT', 'CANCELLED'],
  IN_TRANSIT: ['DELIVERED', 'CANCELLED'],
  DELIVERED: ['COMPLETED', 'RETURNED'],
  COMPLETED: [],
  CANCELLED: [],
  RETURNED: [],
};

@Injectable()
export class OrderService {
  private readonly logger = new Logger(OrderService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly orderNumberService: OrderNumberService,
    private readonly timelineService: OrderTimelineService,
    private readonly documentService: OrderDocumentService,
    private readonly analytics: OrderAnalyticsService,
    private readonly chatService: ChatService,
    private readonly notificationService: NotificationService,
  ) {}

  async create(buyerCompanyId: string, userId: string, dto: CreateOrderDto) {
    if (dto.idempotencyKey) {
      const existing = await this.prisma.order.findUnique({
        where: { idempotencyKey: dto.idempotencyKey },
      });
      if (existing) return existing;
    }

    const seller = await this.prisma.company.findFirst({ where: { id: dto.sellerCompanyId, deletedAt: null } });
    if (!seller) throw new NotFoundException('Seller company not found');

    const buyerLocation = await this.prisma.companyLocation.findFirst({
      where: { companyId: buyerCompanyId, isPrimary: true },
      select: { state: true },
    });
    const stateCode = buyerLocation?.state ?? 'XX';

    const orderNumber = await this.orderNumberService.generate(stateCode);

    const order = await this.prisma.$transaction(async (tx) => {
      return tx.order.create({
        data: {
          orderNumber,
          stateCode,
          idempotencyKey: dto.idempotencyKey ?? null,
          source: dto.source,
          type: dto.type,
          status: 'PENDING',
          statusChangedBy: userId,
          buyerCompanyId,
          sellerCompanyId: dto.sellerCompanyId,
          rfqId: dto.rfqId ?? null,
          quoteId: dto.quoteId ?? null,
          title: dto.title ?? null,
          description: dto.description ?? null,
          currency: dto.currency ?? 'INR',
          subtotal: dto.subtotal,
          taxAmount: dto.taxAmount ?? null,
          discountAmount: dto.discountAmount ?? null,
          totalAmount: dto.totalAmount,
          quantity: dto.quantity,
          unit: dto.unit ?? null,
          deliveryMethod: dto.deliveryMethod ?? null,
          expectedDeliveryDate: dto.expectedDeliveryDate ? new Date(dto.expectedDeliveryDate) : null,
          buyerNotes: dto.buyerNotes ?? null,
          createdBy: userId,
          updatedBy: userId,
          items: {
            create: dto.items.map((item) => ({
              productId: item.productId ?? null,
              productName: item.productName,
              sku: item.sku ?? null,
              quantity: item.quantity,
              reservedQuantity: item.productId ? item.quantity : 0,
              unitPrice: item.unitPrice,
              totalPrice: item.unitPrice * item.quantity,
              taxPercent: item.taxPercent ?? null,
              taxAmount: item.taxPercent ? (item.unitPrice * item.quantity * item.taxPercent) / 100 : null,
            })),
          },
          locations: dto.locations?.length
            ? { create: dto.locations.map((loc) => ({
                type: loc.type as any,
                address: loc.address,
                city: loc.city,
                state: loc.state,
                country: loc.country ?? 'India',
                pincode: loc.pincode ?? null,
                contactName: loc.contactName ?? null,
                contactPhone: loc.contactPhone ?? null,
                isDeliveryLocation: loc.isDeliveryLocation ?? false,
              })) }
            : undefined,
        },
        include: { items: true, locations: true },
      });
    });

    await this.timelineService.addEvent(order.id, 'PENDING', userId, 'BUYER');
    await this.analytics.trackEvent(buyerCompanyId, order.id, 'ORDER_CREATED', {
      source: dto.source, type: dto.type, totalAmount: dto.totalAmount,
    });

    try {
      const primaryOwners = await this.prisma.companyOwner.findMany({
        where: { companyId: { in: [buyerCompanyId, dto.sellerCompanyId] }, isPrimary: true },
        select: { userId: true, companyId: true },
      });
      if (primaryOwners.length >= 2) {
        const participantCompanyIds = [buyerCompanyId, dto.sellerCompanyId];
        await this.chatService.createConversation(buyerCompanyId, userId, {
          type: 'ORDER',
          title: `Order: ${orderNumber}`,
          participantCompanyIds,
        });
      }
    } catch (err) {
      this.logger.warn(`Failed to create order chat room: ${(err as Error).message}`);
    }

    try {
      await this.notificationService.createWithTemplate(buyerCompanyId, undefined, NotificationType.ORDER_CONFIRMED, { orderNumber, createdById: userId });
    } catch (err) {
      this.logger.warn(`Failed to send ORDER_CONFIRMED to buyer: ${(err as Error).message}`);
    }
    try {
      await this.notificationService.createWithTemplate(dto.sellerCompanyId, undefined, NotificationType.ORDER_CONFIRMED, { orderNumber, createdById: userId });
    } catch (err) {
      this.logger.warn(`Failed to send ORDER_CONFIRMED to seller: ${(err as Error).message}`);
    }

    return order;
  }

  async findByBuyer(buyerCompanyId: string, status?: OrderStatus, page = 1, limit = 20) {
    const where: any = { buyerCompanyId, deletedAt: null };
    if (status) where.status = status;

    const [data, total] = await Promise.all([
      this.prisma.order.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          items: { select: { id: true, productName: true, quantity: true, deliveredQuantity: true, unitPrice: true, totalPrice: true } },
          sellerCompany: { select: { id: true, name: true, slug: true, logo: true } },
          _count: { select: { documents: true, returns: true } },
        },
      }),
      this.prisma.order.count({ where }),
    ]);

    return { data, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }

  async findBySeller(sellerCompanyId: string, status?: OrderStatus, page = 1, limit = 20) {
    const where: any = { sellerCompanyId, deletedAt: null };
    if (status) where.status = status;

    const [data, total] = await Promise.all([
      this.prisma.order.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          items: { select: { id: true, productName: true, quantity: true, deliveredQuantity: true, unitPrice: true, totalPrice: true } },
          buyerCompany: { select: { id: true, name: true, slug: true, logo: true } },
          _count: { select: { documents: true, returns: true } },
        },
      }),
      this.prisma.order.count({ where }),
    ]);

    return { data, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }

  async findById(orderId: string, companyId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: true,
        locations: true,
        timeline: { orderBy: { createdAt: 'asc' } },
        documents: { orderBy: { createdAt: 'desc' } },
        cancellations: { orderBy: { createdAt: 'desc' }, take: 1 },
        returns: { orderBy: { createdAt: 'desc' } },
        buyerCompany: { select: { id: true, name: true, slug: true, logo: true, trustScore: true } },
        sellerCompany: { select: { id: true, name: true, slug: true, logo: true, trustScore: true } },
      },
    });
    if (!order || order.deletedAt) throw new NotFoundException('Order not found');
    if (order.buyerCompanyId !== companyId && order.sellerCompanyId !== companyId) {
      throw new ForbiddenException('Access denied');
    }
    return order;
  }

  async updateOrder(orderId: string, companyId: string, userId: string, dto: UpdateOrderDto) {
    const order = await this.prisma.order.findUnique({ where: { id: orderId } });
    if (!order || order.deletedAt) throw new NotFoundException('Order not found');
    if (order.sellerCompanyId !== companyId) throw new ForbiddenException('Only seller can update order details');
    if (order.status !== 'PENDING' && order.status !== 'CONFIRMED') {
      throw new BadRequestException('Can only update order in PENDING or CONFIRMED status');
    }

    const updated = await this.prisma.order.update({
      where: { id: orderId },
      data: {
        title: dto.title ?? undefined,
        description: dto.description ?? undefined,
        deliveryMethod: dto.deliveryMethod ?? undefined,
        trackingNumber: dto.trackingNumber ?? undefined,
        transporterName: dto.transporterName ?? undefined,
        vehicleNumber: dto.vehicleNumber ?? undefined,
        lrNumber: dto.lrNumber ?? undefined,
        ewayBillNumber: dto.ewayBillNumber ?? undefined,
        expectedDeliveryDate: dto.expectedDeliveryDate ? new Date(dto.expectedDeliveryDate) : undefined,
        sellerNotes: dto.sellerNotes ?? undefined,
        updatedBy: userId,
      },
    });

    return updated;
  }

  async updateStatus(orderId: string, companyId: string, userId: string, newStatus: OrderStatus, note?: string) {
    const order = await this.prisma.order.findUnique({ where: { id: orderId } });
    if (!order || order.deletedAt) throw new NotFoundException('Order not found');

    if (order.buyerCompanyId !== companyId && order.sellerCompanyId !== companyId) {
      throw new ForbiddenException('Access denied');
    }

    const allowedTransitions = STATUS_FLOW[order.status];
    if (!allowedTransitions || !allowedTransitions.includes(newStatus)) {
      throw new BadRequestException(`Cannot transition from ${order.status} to ${newStatus}`);
    }

    const changedByRole = order.buyerCompanyId === companyId ? 'BUYER' : order.sellerCompanyId === companyId ? 'SELLER' : 'ADMIN';

    if (newStatus === 'DELIVERED' && changedByRole !== 'BUYER') {
      throw new ForbiddenException('Only buyer can confirm delivery');
    }

    const updated = await this.prisma.order.update({
      where: { id: orderId },
      data: {
        status: newStatus,
        statusChangedAt: new Date(),
        statusChangedBy: userId,
        deliveredAt: newStatus === 'DELIVERED' ? new Date() : undefined,
        updatedBy: userId,
      },
    });

    await this.timelineService.addEvent(orderId, newStatus, userId, changedByRole, order.status, note);
    await this.analytics.trackEvent(companyId, orderId, `ORDER_${newStatus}`, {
      fromStatus: order.status, note,
    });

    if (newStatus === 'PROCESSING') {
      try {
        await this.notificationService.createWithTemplate(order.buyerCompanyId, undefined, NotificationType.ORDER_PROCESSING, { orderNumber: order.orderNumber, createdById: userId });
      } catch (err) {
        this.logger.warn(`Failed to send ORDER_PROCESSING: ${(err as Error).message}`);
      }
    }

    return updated;
  }

  async dispatchLocation(orderId: string, locationId: string, companyId: string, userId: string) {
    const order = await this.prisma.order.findUnique({ where: { id: orderId } });
    if (!order || order.deletedAt) throw new NotFoundException('Order not found');
    if (order.sellerCompanyId !== companyId) throw new ForbiddenException('Only seller can dispatch');
    if (order.status !== 'PROCESSING') throw new BadRequestException('Order must be in PROCESSING status');

    const location = await this.prisma.orderLocation.findUnique({ where: { id: locationId } });
    if (!location || location.orderId !== orderId) throw new NotFoundException('Location not found');
    if (location.deliveryStatus !== 'PENDING') throw new BadRequestException('Location already dispatched');

    const updated = await this.prisma.orderLocation.update({
      where: { id: locationId },
      data: { deliveryStatus: 'DISPATCHED', dispatchedAt: new Date() },
    });

    await this.timelineService.addEvent(orderId, 'PROCESSING', userId, 'SELLER', undefined, `Location dispatched: ${location.city}`);
    try {
      await this.notificationService.createWithTemplate(order.buyerCompanyId, undefined, NotificationType.ORDER_DISPATCHED, { orderNumber: order.orderNumber, createdById: userId });
    } catch (err) {
      this.logger.warn(`Failed to send ORDER_DISPATCHED: ${(err as Error).message}`);
    }
    return updated;
  }

  async deliverLocation(orderId: string, locationId: string, companyId: string, userId: string) {
    const order = await this.prisma.order.findUnique({ where: { id: orderId } });
    if (!order || order.deletedAt) throw new NotFoundException('Order not found');
    if (order.buyerCompanyId !== companyId) throw new ForbiddenException('Only buyer can confirm delivery');
    if (order.status !== 'DISPATCHED') throw new BadRequestException('Order must be in DISPATCHED status');

    const location = await this.prisma.orderLocation.findUnique({ where: { id: locationId } });
    if (!location || location.orderId !== orderId) throw new NotFoundException('Location not found');
    if (location.deliveryStatus !== 'DISPATCHED') throw new BadRequestException('Location must be dispatched first');

    const updated = await this.prisma.orderLocation.update({
      where: { id: locationId },
      data: { deliveryStatus: 'DELIVERED', deliveredAt: new Date() },
    });

    try {
      await this.notificationService.createWithTemplate(order.buyerCompanyId, undefined, NotificationType.ORDER_DELIVERED, { orderNumber: order.orderNumber, createdById: userId });
    } catch (err) {
      this.logger.warn(`Failed to send ORDER_DELIVERED: ${(err as Error).message}`);
    }

    const allDelivered = await this.prisma.orderLocation.count({
      where: { orderId, deliveryStatus: { not: 'DELIVERED' } },
    });

    if (allDelivered === 0) {
      await this.updateStatus(orderId, companyId, userId, 'DELIVERED', 'All locations delivered');
      try {
        await this.notificationService.createWithTemplate(order.buyerCompanyId, undefined, NotificationType.ORDER_COMPLETED, { orderNumber: order.orderNumber, createdById: userId });
      } catch (err) {
        this.logger.warn(`Failed to send ORDER_COMPLETED: ${(err as Error).message}`);
      }
    }

    await this.timelineService.addEvent(orderId, 'DISPATCHED', userId, 'BUYER', undefined, `Location delivered: ${location.city}`);
    return updated;
  }

  async cancelOrder(orderId: string, companyId: string, userId: string, dto: CancelOrderDto) {
    const order = await this.prisma.order.findUnique({ where: { id: orderId } });
    if (!order || order.deletedAt) throw new NotFoundException('Order not found');

    const isBuyer = order.buyerCompanyId === companyId;
    const isSeller = order.sellerCompanyId === companyId;
    if (!isBuyer && !isSeller) throw new ForbiddenException('Access denied');

    if (order.status === 'COMPLETED' || order.status === 'CANCELLED' || order.status === 'RETURNED') {
      throw new BadRequestException(`Order in ${order.status} status cannot be cancelled`);
    }

    const actor = dto.actor ?? (isBuyer ? 'BUYER' : 'SELLER');

    const updated = await this.prisma.$transaction(async (tx) => {
      const cancelled = await tx.order.update({
        where: { id: orderId },
        data: {
          status: 'CANCELLED',
          statusChangedAt: new Date(),
          statusChangedBy: userId,
          updatedBy: userId,
        },
      });

      await tx.orderCancellation.create({
        data: {
          orderId,
          reason: dto.reason,
          reasonText: dto.reasonText ?? null,
          cancelledBy: userId,
          actor: actor as any,
          statusBeforeCancel: order.status,
          note: dto.note ?? null,
        },
      });

      await tx.orderItem.updateMany({
        where: { orderId },
        data: { reservedQuantity: 0 },
      });

      return cancelled;
    });

    await this.timelineService.addEvent(orderId, 'CANCELLED', userId, actor, order.status, dto.reasonText ?? dto.reason);
    await this.analytics.trackEvent(companyId, orderId, 'ORDER_CANCELLED', {
      reason: dto.reason, actor,
    });

    try {
      const otherCompanyId = isBuyer ? order.sellerCompanyId : order.buyerCompanyId;
      await this.notificationService.createWithTemplate(otherCompanyId, undefined, NotificationType.ORDER_CANCELLED, { orderNumber: order.orderNumber, cancelledBy: actor, reason: dto.reason, reasonText: dto.reasonText, createdById: userId });
    } catch (err) {
      this.logger.warn(`Failed to send ORDER_CANCELLED: ${(err as Error).message}`);
    }

    return updated;
  }

  async requestReturn(orderId: string, companyId: string, userId: string, dto: CreateReturnDto) {
    const order = await this.prisma.order.findUnique({ where: { id: orderId } });
    if (!order || order.deletedAt) throw new NotFoundException('Order not found');
    if (order.buyerCompanyId !== companyId) throw new ForbiddenException('Only buyer can request return');
    if (order.status !== 'DELIVERED') throw new BadRequestException('Only delivered orders can be returned');

    const daysSinceDelivery = Math.floor((Date.now() - (order.deliveredAt ?? order.updatedAt).getTime()) / 86400000);
    if (daysSinceDelivery > 7) throw new BadRequestException('Return window of 7 days has expired');

    const returnRequest = await this.prisma.orderReturn.create({
      data: {
        orderId,
        itemId: dto.itemId ?? null,
        reason: dto.reason,
        description: dto.description ?? null,
        quantity: dto.quantity ?? null,
        requestedBy: userId,
        requestedByRole: 'BUYER',
      },
    });

    await this.timelineService.addEvent(orderId, order.status, userId, 'BUYER', undefined, `Return requested: ${dto.reason}`);
    await this.analytics.trackEvent(companyId, orderId, 'RETURN_REQUESTED', {
      reason: dto.reason, returnId: returnRequest.id,
    });

    try {
      await this.notificationService.createWithTemplate(order.sellerCompanyId, undefined, NotificationType.ORDER_RETURNED, { orderNumber: order.orderNumber, reason: dto.reason, description: dto.description, createdById: userId });
    } catch (err) {
      this.logger.warn(`Failed to send ORDER_RETURNED: ${(err as Error).message}`);
    }

    return returnRequest;
  }

  async reviewReturn(returnId: string, companyId: string, userId: string, dto: ReviewReturnDto) {
    const ret = await this.prisma.orderReturn.findUnique({ where: { id: returnId }, include: { order: true } });
    if (!ret) throw new NotFoundException('Return request not found');
    if (ret.order.sellerCompanyId !== companyId) throw new ForbiddenException('Only seller can review returns');
    if (ret.status !== 'PENDING') throw new BadRequestException('Return already reviewed');

    const review = await this.prisma.$transaction(async (tx) => {
      const r = await tx.orderReturn.update({
        where: { id: returnId },
        data: {
          status: dto.status,
          reviewedBy: userId,
          reviewedAt: new Date(),
          adminNote: dto.adminNote ?? null,
        },
      });

      if (dto.status === 'APPROVED') {
        await tx.order.update({
          where: { id: ret.orderId },
          data: {
            status: 'RETURNED',
            statusChangedAt: new Date(),
            statusChangedBy: userId,
            updatedBy: userId,
          },
        });
      }

      return r;
    });

    if (dto.status === 'APPROVED') {
      await this.timelineService.addEvent(ret.orderId, 'RETURNED', userId, 'SELLER', 'DELIVERED', 'Return approved');
      try {
        await this.notificationService.createWithTemplate(ret.order.buyerCompanyId, undefined, NotificationType.ORDER_RETURN_APPROVED, { orderNumber: ret.order.orderNumber, adminNote: dto.adminNote, createdById: userId });
      } catch (err) {
        this.logger.warn(`Failed to send ORDER_RETURN_APPROVED: ${(err as Error).message}`);
      }
    } else if (dto.status === 'REJECTED') {
      try {
        await this.notificationService.createWithTemplate(ret.order.buyerCompanyId, undefined, NotificationType.ORDER_RETURN_REJECTED, { orderNumber: ret.order.orderNumber, adminNote: dto.adminNote, createdById: userId });
      } catch (err) {
        this.logger.warn(`Failed to send ORDER_RETURN_REJECTED: ${(err as Error).message}`);
      }
    }

    await this.analytics.trackEvent(companyId, ret.orderId, `RETURN_${dto.status}`);
    return review;
  }

  async getOrdersByCompany(companyId: string, role: 'buyer' | 'seller', status?: OrderStatus, page = 1, limit = 20) {
    return role === 'buyer' ? this.findByBuyer(companyId, status, page, limit) : this.findBySeller(companyId, status, page, limit);
  }

  async uploadDocument(orderId: string, companyId: string, userId: string, dto: CreateOrderDocumentDto) {
    const order = await this.prisma.order.findUnique({ where: { id: orderId } });
    if (!order || order.deletedAt) throw new NotFoundException('Order not found');
    if (order.buyerCompanyId !== companyId && order.sellerCompanyId !== companyId) {
      throw new ForbiddenException('Access denied');
    }
    return this.documentService.upload(orderId, userId, dto);
  }

  async getDocuments(orderId: string, companyId: string) {
    const order = await this.prisma.order.findUnique({ where: { id: orderId } });
    if (!order || order.deletedAt) throw new NotFoundException('Order not found');
    if (order.buyerCompanyId !== companyId && order.sellerCompanyId !== companyId) {
      throw new ForbiddenException('Access denied');
    }
    return this.documentService.getDocuments(orderId);
  }

  async getTimeline(orderId: string, companyId: string) {
    const order = await this.prisma.order.findUnique({ where: { id: orderId } });
    if (!order || order.deletedAt) throw new NotFoundException('Order not found');
    if (order.buyerCompanyId !== companyId && order.sellerCompanyId !== companyId) {
      throw new ForbiddenException('Access denied');
    }
    return this.timelineService.getTimeline(orderId);
  }

  async getAnalytics(companyId: string) {
    return this.analytics.getOrderMetrics(companyId);
  }

  async getLocationStatus(orderId: string, companyId: string) {
    const order = await this.prisma.order.findUnique({ where: { id: orderId } });
    if (!order || order.deletedAt) throw new NotFoundException('Order not found');
    if (order.buyerCompanyId !== companyId && order.sellerCompanyId !== companyId) {
      throw new ForbiddenException('Access denied');
    }
    return this.prisma.orderLocation.findMany({
      where: { orderId },
      orderBy: { createdAt: 'asc' },
    });
  }
}
