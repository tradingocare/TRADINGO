import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { SetCreditLimitDto, UpdateCreditStatusDto, UpdateRiskLevelDto, QueryCreditDto, RequestCreditApprovalDto, ApproveCreditApprovalDto, RejectCreditApprovalDto } from './dto';
import { CreditStatus, CreditApprovalStatus, Prisma } from '@prisma/client';

@Injectable()
export class CreditService {
  constructor(private readonly prisma: PrismaService) {}

  async setCreditLimit(companyId: string, dto: SetCreditLimitDto, userId: string) {
    const company = await this.prisma.company.findUnique({ where: { id: companyId } });
    if (!company) throw new NotFoundException('Company not found');

    const existing = await this.prisma.buyerCredit.findUnique({ where: { companyId } });
    if (existing) {
      const updated = await this.prisma.buyerCredit.update({
        where: { companyId },
        data: { creditLimit: new Prisma.Decimal(dto.creditLimit), lastReviewedAt: new Date(), reviewedBy: userId, notes: dto.notes },
      });
      await this.prisma.creditHistory.create({
        data: { buyerCreditId: updated.id, changeType: 'LIMIT_CHANGED', amount: new Prisma.Decimal(dto.creditLimit), balanceAfter: updated.availableCredit, reason: dto.notes || 'Credit limit updated', changedBy: userId },
      });
      return updated;
    }

    const created = await this.prisma.buyerCredit.create({
      data: { companyId, creditLimit: new Prisma.Decimal(dto.creditLimit), availableCredit: new Prisma.Decimal(dto.creditLimit), usedCredit: 0, blockedCredit: 0, lastReviewedAt: new Date(), reviewedBy: userId, notes: dto.notes },
    });
    await this.prisma.creditHistory.create({
      data: { buyerCreditId: created.id, changeType: 'LIMIT_CHANGED', amount: new Prisma.Decimal(dto.creditLimit), balanceAfter: new Prisma.Decimal(dto.creditLimit), reason: 'Initial credit setup', changedBy: userId },
    });
    return created;
  }

  async updateStatus(companyId: string, dto: UpdateCreditStatusDto, userId: string) {
    const credit = await this.prisma.buyerCredit.findUnique({ where: { companyId } });
    if (!credit) throw new NotFoundException('Buyer credit not found');
    const updated = await this.prisma.buyerCredit.update({ where: { companyId }, data: { status: dto.status, lastReviewedAt: new Date(), reviewedBy: userId } });
    await this.prisma.creditHistory.create({
      data: { buyerCreditId: updated.id, changeType: dto.status === CreditStatus.SUSPENDED ? 'SUSPENDED' : dto.status === CreditStatus.BLOCKED ? 'BLOCKED' : 'RESTORED', reason: dto.reason, changedBy: userId },
    });
    return updated;
  }

  async updateRiskLevel(companyId: string, dto: UpdateRiskLevelDto, userId: string) {
    const credit = await this.prisma.buyerCredit.findUnique({ where: { companyId } });
    if (!credit) throw new NotFoundException('Buyer credit not found');
    return this.prisma.buyerCredit.update({ where: { companyId }, data: { riskLevel: dto.riskLevel, lastReviewedAt: new Date(), reviewedBy: userId, notes: dto.reason } });
  }

  async getCredit(companyId: string) {
    const credit = await this.prisma.buyerCredit.findUnique({
      where: { companyId },
      include: { company: { select: { id: true, name: true, slug: true, logo: true, email: true, trustScore: true } } },
    });
    if (!credit) throw new NotFoundException('Buyer credit not found');
    return credit;
  }

  async listCredits(query: QueryCreditDto) {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const skip = (page - 1) * limit;
    const where: Prisma.BuyerCreditWhereInput = {};

    if (query.search) {
      where.company = { name: { contains: query.search, mode: 'insensitive' } };
    }
    if (query.status) where.status = query.status;
    if (query.riskLevel) where.riskLevel = query.riskLevel;

    const [data, total] = await Promise.all([
      this.prisma.buyerCredit.findMany({
        where, skip, take: limit, orderBy: { updatedAt: 'desc' },
        include: { company: { select: { id: true, name: true, slug: true, logo: true, email: true, trustScore: true } } },
      }),
      this.prisma.buyerCredit.count({ where }),
    ]);
    return { data, meta: { total, page, limit, totalPages: Math.ceil(total / limit), hasNext: page * limit < total, hasPrevious: page > 1 } };
  }

  async getCreditHistory(companyId: string) {
    const credit = await this.prisma.buyerCredit.findUnique({ where: { companyId } });
    if (!credit) throw new NotFoundException('Buyer credit not found');
    return this.prisma.creditHistory.findMany({ where: { buyerCreditId: credit.id }, orderBy: { createdAt: 'desc' }, take: 100 });
  }

  async getUtilization() {
    const all = await this.prisma.buyerCredit.findMany({ select: { creditLimit: true, usedCredit: true, blockedCredit: true, availableCredit: true } });
    const totalLimit = Number(all.reduce((s, c) => s + Number(c.creditLimit), 0));
    const totalUsed = Number(all.reduce((s, c) => s + Number(c.usedCredit), 0));
    const totalBlocked = Number(all.reduce((s, c) => s + Number(c.blockedCredit), 0));
    return { totalLimit, totalUsed, totalBlocked, utilizationRate: totalLimit > 0 ? Number((totalUsed / totalLimit * 100).toFixed(2)) : 0 };
  }

  async requestApproval(companyId: string, dto: RequestCreditApprovalDto, userId: string) {
    const credit = await this.prisma.buyerCredit.findUnique({ where: { companyId } });
    if (!credit) throw new NotFoundException('Buyer credit not found');
    return this.prisma.creditApproval.create({
      data: { buyerCreditId: credit.id, requestType: dto.requestType, requestedLimit: dto.requestedLimit ? new Prisma.Decimal(dto.requestedLimit) : undefined, currentLimit: credit.creditLimit, reason: dto.reason, requestedBy: userId },
    });
  }

  async listApprovals(companyId: string) {
    const credit = await this.prisma.buyerCredit.findUnique({ where: { companyId } });
    if (!credit) throw new NotFoundException('Buyer credit not found');
    return this.prisma.creditApproval.findMany({ where: { buyerCreditId: credit.id }, orderBy: { createdAt: 'desc' } });
  }

  async listAllApprovals(query: { page?: number; limit?: number; status?: CreditApprovalStatus }) {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const where: Prisma.CreditApprovalWhereInput = {};
    if (query.status) where.status = query.status;
    const [data, total] = await Promise.all([
      this.prisma.creditApproval.findMany({ where, skip: (page - 1) * limit, take: limit, orderBy: { createdAt: 'desc' }, include: { buyerCredit: { include: { company: { select: { id: true, name: true } } } } } }),
      this.prisma.creditApproval.count({ where }),
    ]);
    return { data, meta: { total, page, limit, totalPages: Math.ceil(total / limit), hasNext: page * limit < total, hasPrevious: page > 1 } };
  }

  async approveApproval(id: string, dto: ApproveCreditApprovalDto, userId: string) {
    const approval = await this.prisma.creditApproval.findUnique({ where: { id }, include: { buyerCredit: true } });
    if (!approval) throw new NotFoundException('Approval request not found');
    if (approval.status !== CreditApprovalStatus.PENDING) throw new BadRequestException('Approval already processed');

    await this.prisma.creditApproval.update({ where: { id }, data: { status: CreditApprovalStatus.APPROVED, approvedBy: userId, approvedAt: new Date(), reviewedAt: new Date() } });

    if (approval.requestedLimit && approval.buyerCredit) {
      const newLimit = new Prisma.Decimal(approval.requestedLimit);
      await this.prisma.buyerCredit.update({ where: { id: approval.buyerCreditId }, data: { creditLimit: newLimit, lastReviewedAt: new Date(), reviewedBy: userId } });
      const diff = newLimit.minus(approval.currentLimit || 0);
      await this.prisma.creditHistory.create({
        data: { buyerCreditId: approval.buyerCreditId, changeType: 'LIMIT_CHANGED', amount: newLimit, reason: `Approved: ${approval.reason}`, changedBy: userId },
      });
    }
    return { approved: true };
  }

  async rejectApproval(id: string, dto: RejectCreditApprovalDto, userId: string) {
    const approval = await this.prisma.creditApproval.findUnique({ where: { id } });
    if (!approval) throw new NotFoundException('Approval request not found');
    if (approval.status !== CreditApprovalStatus.PENDING) throw new BadRequestException('Approval already processed');
    return this.prisma.creditApproval.update({ where: { id }, data: { status: CreditApprovalStatus.REJECTED, rejectionReason: dto.reason, reviewedAt: new Date() } });
  }
}
