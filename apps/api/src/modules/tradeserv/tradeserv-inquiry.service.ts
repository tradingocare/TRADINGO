import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificationService } from '../notification/notification.service';
import { InquiryStatus } from '@prisma/client';

@Injectable()
export class TradeservInquiryService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationService: NotificationService,
  ) {}

  async getInquiries(companyId: string) {
    return this.prisma.professionalInquiry.findMany({
      where: { companyId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getInquiry(id: string, companyId: string) {
    const inquiry = await this.prisma.professionalInquiry.findFirst({
      where: { id, companyId },
    });
    if (!inquiry) throw new NotFoundException('Inquiry not found');
    return inquiry;
  }

  async createInquiry(companyId: string, dto: {
    clientName: string; clientCompany?: string; email: string; phone?: string;
    requirement: string; budget?: string; timeline?: string;
  }) {
    const inquiry = await this.prisma.professionalInquiry.create({
      data: { ...dto, companyId },
    });

    await this.notificationService.createWithTemplate(
      companyId,
      undefined,
      'INQUIRY_RECEIVED' as any,
      { clientName: dto.clientName, requirement: dto.requirement.substring(0, 100) },
      { sourceModule: 'TRADESERV', link: '/seller/tradeserv/inquiries' },
    );

    return inquiry;
  }

  async updateInquiryStatus(id: string, companyId: string, status: InquiryStatus) {
    const inquiry = await this.prisma.professionalInquiry.findFirst({
      where: { id, companyId },
    });
    if (!inquiry) throw new NotFoundException('Inquiry not found');

    const data: Record<string, unknown> = { status };
    if (status === 'VIEWED' && inquiry.status === 'NEW') {
      // auto-mark as viewed when fetched
    }
    return this.prisma.professionalInquiry.update({ where: { id }, data });
  }

  async getInquiryCount(companyId: string) {
    return this.prisma.professionalInquiry.count({ where: { companyId } });
  }

  async getInquiryStats(companyId: string) {
    const [total, accepted, rejected, closed] = await Promise.all([
      this.prisma.professionalInquiry.count({ where: { companyId } }),
      this.prisma.professionalInquiry.count({ where: { companyId, status: 'ACCEPTED' } }),
      this.prisma.professionalInquiry.count({ where: { companyId, status: 'REJECTED' } }),
      this.prisma.professionalInquiry.count({ where: { companyId, status: 'CLOSED' } }),
    ]);
    return { total, accepted, rejected, closed, pending: total - accepted - rejected - closed };
  }
}
