import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { SmsProviderFactory } from './sms-provider.factory';
import { SMS_TEMPLATES, SMS_RATE_LIMITS } from './sms.constants';

@Injectable()
export class SmsService {
  private readonly logger = new Logger(SmsService.name);
  private readonly rateMap = new Map<string, number[]>();

  constructor(
    private readonly smsProviderFactory: SmsProviderFactory,
    private readonly prisma: PrismaService,
  ) {}

  async sendOtp(phoneNumber: string, otp: string, template: 'OTP_LOGIN' | 'OTP_REGISTER' | 'OTP_RESET_PASSWORD' | 'OTP_VERIFY_MOBILE' = 'OTP_LOGIN'): Promise<{ success: boolean; messageId?: string }> {
    const message = SMS_TEMPLATES[template](otp);
    return this.send(phoneNumber, message, template);
  }

  async sendTransactional(phoneNumber: string, template: keyof typeof SMS_TEMPLATES, ...args: Parameters<(typeof SMS_TEMPLATES)[keyof typeof SMS_TEMPLATES]>): Promise<{ success: boolean; messageId?: string }> {
    const message = (SMS_TEMPLATES[template] as (...args: string[]) => string)(...args.map(String));
    return this.send(phoneNumber, message, template);
  }

  async send(phoneNumber: string, message: string, template?: string): Promise<{ success: boolean; messageId?: string }> {
    if (!this.checkRateLimit(phoneNumber)) {
      this.logger.warn(`Rate limit exceeded for ${phoneNumber}`);
      return { success: false };
    }

    const provider = this.smsProviderFactory.getProvider();
    const result = await provider.send(phoneNumber, message);

    await this.prisma.smsLog.create({
      data: {
        phoneNumber,
        message,
        template: template ?? null,
        provider: provider.getName(),
        status: result.success ? 'sent' : 'failed',
        messageId: result.messageId ?? null,
        error: result.error ?? null,
      },
    });

    if (!result.success) {
      this.logger.error(`SMS failed to ${phoneNumber}: ${result.error}`);
    }

    return { success: result.success, messageId: result.messageId };
  }

  async getStats(): Promise<{
    totalSent: number;
    totalFailed: number;
    successRate: number;
    byProvider: Record<string, number>;
    byTemplate: Record<string, number>;
    todayCount: number;
  }> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [totalSent, totalFailed, todayCount, byProvider, byTemplate] = await Promise.all([
      this.prisma.smsLog.count({ where: { status: 'sent' } }),
      this.prisma.smsLog.count({ where: { status: 'failed' } }),
      this.prisma.smsLog.count({ where: { createdAt: { gte: today }, status: 'sent' } }),
      this.prisma.smsLog.groupBy({ by: ['provider'], _count: { provider: true } }),
      this.prisma.smsLog.groupBy({ by: ['template'], _count: { template: true }, where: { template: { not: null } } }),
    ]);

    const total = totalSent + totalFailed;

    return {
      totalSent,
      totalFailed,
      successRate: total > 0 ? Math.round((totalSent / total) * 100) : 0,
      byProvider: Object.fromEntries(byProvider.map((p) => [p.provider, p._count.provider])),
      byTemplate: Object.fromEntries(byTemplate.map((t) => [t.template, t._count.template])),
      todayCount,
    };
  }

  async getLogs(params: {
    phoneNumber?: string;
    status?: string;
    template?: string;
    startDate?: string;
    endDate?: string;
    page?: number;
    limit?: number;
  }): Promise<{ data: unknown[]; total: number; page: number; limit: number }> {
    const where: Record<string, unknown> = {};
    if (params.phoneNumber) where['phoneNumber'] = { contains: params.phoneNumber };
    if (params.status) where['status'] = params.status;
    if (params.template) where['template'] = params.template;
    if (params.startDate || params.endDate) {
      const createdAt: Record<string, Date> = {};
      if (params.startDate) createdAt['gte'] = new Date(params.startDate);
      if (params.endDate) createdAt['lte'] = new Date(params.endDate);
      where['createdAt'] = createdAt;
    }

    const page = params.page ?? 1;
    const limit = Math.min(params.limit ?? 50, 200);

    const [data, total] = await Promise.all([
      this.prisma.smsLog.findMany({
        where: where as any,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: (page - 1) * limit,
      }),
      this.prisma.smsLog.count({ where: where as any }),
    ]);

    return { data, total, page, limit };
  }

  private checkRateLimit(phoneNumber: string): boolean {
    const now = Date.now();

    for (const limit of Object.values(SMS_RATE_LIMITS)) {
      const timestamps = this.rateMap.get(phoneNumber) ?? [];
      const recent = timestamps.filter((t) => now - t < limit.windowMs);
      if (recent.length >= limit.max) return false;
      recent.push(now);
      this.rateMap.set(phoneNumber, recent);
    }

    return true;
  }
}
