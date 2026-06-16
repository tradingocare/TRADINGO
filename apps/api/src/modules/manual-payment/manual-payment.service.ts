import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateManualPaymentProofDto, VerifyManualPaymentProofDto, RejectManualPaymentProofDto, QueryManualPaymentProofDto } from './dto/manual-payment.dto';

@Injectable()
export class ManualPaymentService {
  constructor(private readonly prisma: PrismaService) {}

  async create(companyId: string, userId: string, dto: CreateManualPaymentProofDto) {
    const payment = await this.prisma.payment.findFirst({
      where: { id: dto.paymentId, companyId },
    });
    if (!payment) throw new NotFoundException('Payment not found');

    const existing = await this.prisma.manualPaymentProof.findUnique({
      where: { paymentId: dto.paymentId },
    });
    if (existing) throw new BadRequestException('Manual payment proof already exists for this payment');

    return this.prisma.manualPaymentProof.create({
      data: {
        paymentId: dto.paymentId,
        companyId,
        utrNumber: dto.utrNumber,
        transactionScreenshot: dto.transactionScreenshot,
        transactionDate: dto.transactionDate ? new Date(dto.transactionDate) : undefined,
        bankName: dto.bankName,
        paymentMethod: dto.paymentMethod,
        amount: dto.amount,
        verificationStatus: 'PENDING',
      },
      include: { payment: true },
    });
  }

  async findAll(companyId: string, query: QueryManualPaymentProofDto) {
    const where: any = { companyId };
    if (query.verificationStatus) {
      where.verificationStatus = query.verificationStatus;
    }
    const skip = query.skip ?? 0;
    const take = query.take ?? 20;

    const [data, total] = await this.prisma.$transaction([
      this.prisma.manualPaymentProof.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take,
        include: { payment: true },
      }),
      this.prisma.manualPaymentProof.count({ where }),
    ]);

    return { data, meta: { total, skip, take } };
  }

  async findOne(proofId: string, companyId: string) {
    const proof = await this.prisma.manualPaymentProof.findFirst({
      where: { id: proofId, companyId },
      include: { payment: true },
    });
    if (!proof) throw new NotFoundException('Manual payment proof not found');
    return proof;
  }

  async verify(proofId: string, adminId: string, dto: VerifyManualPaymentProofDto) {
    const proof = await this.prisma.manualPaymentProof.findUnique({
      where: { id: proofId },
    });
    if (!proof) throw new NotFoundException('Manual payment proof not found');

    return this.prisma.manualPaymentProof.update({
      where: { id: proofId },
      data: {
        verificationStatus: 'VERIFIED',
        verifiedById: adminId,
        verifiedAt: new Date(),
        remarks: dto.remarks,
      },
      include: { payment: true },
    });
  }

  async reject(proofId: string, adminId: string, dto: RejectManualPaymentProofDto) {
    const proof = await this.prisma.manualPaymentProof.findUnique({
      where: { id: proofId },
    });
    if (!proof) throw new NotFoundException('Manual payment proof not found');

    return this.prisma.manualPaymentProof.update({
      where: { id: proofId },
      data: {
        verificationStatus: 'REJECTED',
        verifiedById: adminId,
        verifiedAt: new Date(),
        remarks: dto.reason,
      },
      include: { payment: true },
    });
  }

  async findAllPending(query: QueryManualPaymentProofDto) {
    const where: any = { verificationStatus: 'PENDING' };
    const skip = query.skip ?? 0;
    const take = query.take ?? 20;

    const [data, total] = await this.prisma.$transaction([
      this.prisma.manualPaymentProof.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take,
        include: { payment: true, company: true },
      }),
      this.prisma.manualPaymentProof.count({ where }),
    ]);

    return { data, meta: { total, skip, take } };
  }
}
