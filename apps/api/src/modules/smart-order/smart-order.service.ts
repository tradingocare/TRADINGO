import { Injectable, NotFoundException, BadRequestException, ForbiddenException, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { OrderService } from '../order/order.service';
import { NotificationService } from '../notification/notification.service';
import { NotificationType, OrderStatus, OrderSource, OrderType } from '@prisma/client';

@Injectable()
export class SmartOrderService {
  private readonly logger = new Logger(SmartOrderService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly orderService: OrderService,
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

  async createFromPo(poId: string, userId: string) {
    const po = await this.prisma.purchaseOrder.findUnique({
      where: { id: poId },
      include: {
        lineItems: { orderBy: { sortOrder: 'asc' } },
        sellerCompany: { select: { id: true, name: true } },
      },
    });
    if (!po) throw new NotFoundException('Purchase order not found');
    if (po.status !== 'LOCKED') throw new BadRequestException('Purchase order must be LOCKED to generate an order');

    const company = await this.getUserCompany(userId);
    const isBuyer = po.buyerCompanyId === company.id;
    if (!isBuyer) throw new ForbiddenException('Only the buyer can generate an order from a PO');

    const existingOrder = await this.prisma.order.findFirst({
      where: { purchaseOrderId: poId, deletedAt: null },
    });
    if (existingOrder) throw new BadRequestException('Order already exists for this purchase order');

    const buyerLocation = await this.prisma.companyLocation.findFirst({
      where: { companyId: po.buyerCompanyId, isPrimary: true },
      select: { state: true },
    });
    const stateCode = buyerLocation?.state ?? 'XX';

    const order = await this.prisma.$transaction(async (tx) => {
      const created = await tx.order.create({
        data: {
          orderNumber: await this.generateOrderNumber(),
          stateCode,
          source: OrderSource.RFQ,
          type: OrderType.PRODUCT,
          status: OrderStatus.PENDING,
          statusChangedBy: userId,
          buyerCompanyId: po.buyerCompanyId,
          sellerCompanyId: po.sellerCompanyId,
          rfqId: po.rfqId,
          quoteId: po.quoteId,
          purchaseOrderId: po.id,
          title: `Order for PO ${po.poNumber}`,
          currency: po.currency,
          subtotal: po.subtotal ?? 0,
          taxAmount: po.taxAmount ?? 0,
          discountAmount: po.discountAmount ?? 0,
          totalAmount: po.totalAmount ?? 0,
          quantity: po.lineItems.reduce((sum, li) => sum + Number(li.quantity ?? 1), 0),
          createdBy: userId,
          updatedBy: userId,
          items: {
            create: po.lineItems.map((li) => ({
              productName: li.productName,
              quantity: li.quantity ?? 1,
              unitPrice: Number(li.unitPrice),
              totalPrice: li.totalPrice ? Number(li.totalPrice) : Number(li.unitPrice) * (li.quantity ?? 1),
              taxPercent: li.gstRate ? Number(li.gstRate) : null,
              taxAmount: li.gstAmount ? Number(li.gstAmount) : null,
            })),
          },
        },
        include: { items: true },
      });

      await tx.purchaseOrder.update({
        where: { id: poId },
        data: { status: 'CONVERTED_TO_ORDER', convertedAt: new Date(), updatedBy: userId },
      });

      return created;
    });

    await this.notifyOrderCreation(po, order, userId);

    return this.orderService.findById(order.id, po.buyerCompanyId);
  }

  private async generateOrderNumber(): Promise<string> {
    const datePart = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const random = Math.floor(10000 + Math.random() * 90000);
    const prefix = `ORD-${datePart}-${random}`;
    const existing = await this.prisma.order.findUnique({ where: { orderNumber: prefix } });
    if (existing) return this.generateOrderNumber();
    return prefix;
  }

  private async notifyOrderCreation(po: any, order: any, userId: string) {
    try {
      await this.notificationService.createWithTemplate(
        po.buyerCompanyId,
        undefined,
        NotificationType.ORDER_CREATED_FROM_PO,
        { orderNumber: order.orderNumber, poNumber: po.poNumber, createdById: userId },
      );
    } catch (err) {
      this.logger.warn(`Failed to notify buyer: ${(err as Error).message}`);
    }
    try {
      await this.notificationService.createWithTemplate(
        po.sellerCompanyId,
        undefined,
        NotificationType.ORDER_CREATED_FROM_PO,
        { orderNumber: order.orderNumber, poNumber: po.poNumber, createdById: userId },
      );
    } catch (err) {
      this.logger.warn(`Failed to notify seller: ${(err as Error).message}`);
    }
  }

  async findByBuyer(userId: string, status?: string, page = 1, limit = 20) {
    const company = await this.getUserCompany(userId);
    return this.orderService.findByBuyer(company.id, status as OrderStatus, page, limit);
  }

  async findBySeller(userId: string, status?: string, page = 1, limit = 20) {
    const company = await this.getUserCompany(userId);
    return this.orderService.findBySeller(company.id, status as OrderStatus, page, limit);
  }

  async findById(orderId: string, userId: string) {
    const company = await this.getUserCompany(userId);
    return this.orderService.findById(orderId, company.id);
  }

  async updateStatus(userId: string, orderId: string, newStatus: string, note?: string) {
    const company = await this.getUserCompany(userId);
    return this.orderService.updateStatus(orderId, company.id, userId, newStatus as OrderStatus, note);
  }

  async updateOrder(userId: string, orderId: string, dto: any) {
    const company = await this.getUserCompany(userId);
    return this.orderService.updateOrder(orderId, company.id, userId, dto);
  }

  async cancelOrder(userId: string, orderId: string, dto: any) {
    const company = await this.getUserCompany(userId);
    return this.orderService.cancelOrder(orderId, company.id, userId, dto);
  }

  async requestReturn(userId: string, orderId: string, dto: any) {
    const company = await this.getUserCompany(userId);
    return this.orderService.requestReturn(orderId, company.id, userId, dto);
  }

  async getTimeline(userId: string, orderId: string) {
    const company = await this.getUserCompany(userId);
    return this.orderService.getTimeline(orderId, company.id);
  }

  async getDocuments(userId: string, orderId: string) {
    const company = await this.getUserCompany(userId);
    return this.orderService.getDocuments(orderId, company.id);
  }

  async getAnalytics(userId: string) {
    const company = await this.getUserCompany(userId);
    return this.orderService.getAnalytics(company.id);
  }

  async getAdminAnalytics() {
    const [totalOrders, byStatus, recentOrders] = await Promise.all([
      this.prisma.order.count({ where: { deletedAt: null } }),
      this.prisma.order.groupBy({ by: ['status'], _count: { id: true }, where: { deletedAt: null } }),
      this.prisma.order.findMany({
        where: { deletedAt: null },
        orderBy: { createdAt: 'desc' },
        take: 50,
        include: {
          buyerCompany: { select: { id: true, name: true, slug: true } },
          sellerCompany: { select: { id: true, name: true, slug: true } },
          items: { select: { productName: true, quantity: true, unitPrice: true } },
        },
      }),
    ]);
    return { totalOrders, byStatus, recentOrders };
  }

  async adminFindAll(page = 1, limit = 50, status?: string) {
    const where: any = { deletedAt: null };
    if (status) where.status = status;
    const [data, total] = await Promise.all([
      this.prisma.order.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          buyerCompany: { select: { id: true, name: true, slug: true } },
          sellerCompany: { select: { id: true, name: true, slug: true } },
          items: { select: { productName: true, quantity: true, unitPrice: true } },
        },
      }),
      this.prisma.order.count({ where }),
    ]);
    return { data, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }

  async adminFindById(orderId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: true,
        locations: true,
        timeline: { orderBy: { createdAt: 'asc' } },
        documents: { orderBy: { createdAt: 'desc' } },
        cancellations: { orderBy: { createdAt: 'desc' } },
        returns: { orderBy: { createdAt: 'desc' } },
        buyerCompany: { select: { id: true, name: true, slug: true, logo: true } },
        sellerCompany: { select: { id: true, name: true, slug: true, logo: true } },
        purchaseOrder: { select: { id: true, poNumber: true } },
      },
    });
    if (!order || order.deletedAt) throw new NotFoundException('Order not found');
    return order;
  }
}
