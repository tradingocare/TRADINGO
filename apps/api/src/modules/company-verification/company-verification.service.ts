import { Injectable, NotFoundException, ConflictException, ForbiddenException, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { SubmitVerificationDto } from './dto/submit-verification.dto';
import { ReviewVerificationDto } from './dto/review-verification.dto';
import { Role } from '../../common/enums/role.enum';
import { Prisma, VerificationLevel } from '@prisma/client';

@Injectable()
export class CompanyVerificationService {
  private readonly logger = new Logger(CompanyVerificationService.name);

  constructor(private readonly prisma: PrismaService) {}

  async submit(dto: SubmitVerificationDto, userId: string) {
    const company = await this.prisma.company.findFirst({
      where: { id: dto.companyId, deletedAt: null },
      select: { id: true, verificationLevel: true },
    });
    if (!company) throw new NotFoundException('Company not found');

    const owner = await this.prisma.companyOwner.findUnique({
      where: { companyId_userId: { companyId: dto.companyId, userId } },
      select: { id: true },
    });
    if (!owner) {
      const user = await this.prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
      if (user?.role !== Role.SUPER_ADMIN && user?.role !== Role.ADMIN) {
        throw new ForbiddenException('Only company owners or admins can submit verification');
      }
    }

    const existingPending = await this.prisma.companyVerification.findFirst({
      where: { companyId: dto.companyId, status: 'PENDING' },
      select: { id: true },
    });
    if (existingPending) throw new ConflictException('A verification request is already pending for this company');

    const verification = await this.prisma.companyVerification.create({
      data: {
        companyId: dto.companyId,
        level: dto.level,
        status: 'PENDING',
        submittedBy: userId,
        notes: dto.notes,
        documents: {
          create: dto.documents.map((doc) => ({
            documentType: doc.documentType,
            documentUrl: doc.documentUrl,
            notes: doc.notes,
          })),
        },
      },
      include: { documents: true },
    });

    await this.prisma.auditLog.create({
      data: {
        userId,
        action: 'SUBMIT_COMPANY_VERIFICATION',
        resource: `company:${dto.companyId}`,
        metadata: { verificationId: verification.id, level: dto.level },
      },
    });

    this.logger.log(`Verification ${verification.id} submitted for company ${dto.companyId}`);
    return verification;
  }

  async review(verificationId: string, dto: ReviewVerificationDto, userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
    if (!user || (user.role !== Role.SUPER_ADMIN && user.role !== Role.ADMIN)) {
      throw new ForbiddenException('Only admins can review verifications');
    }

    const verification = await this.prisma.companyVerification.findUnique({
      where: { id: verificationId },
      include: { company: { select: { id: true, verificationLevel: true, slug: true } } },
    });
    if (!verification) throw new NotFoundException('Verification not found');
    if (verification.status !== 'PENDING') throw new ConflictException('Verification has already been reviewed');

    const updated = await this.prisma.companyVerification.update({
      where: { id: verificationId },
      data: {
        status: dto.status,
        reviewedBy: userId,
        reviewedAt: new Date(),
        notes: dto.notes,
      },
      include: { documents: true },
    });

    if (dto.status === 'APPROVED') {
      const levelOrder = [
        VerificationLevel.LEVEL_0,
        VerificationLevel.LEVEL_1,
        VerificationLevel.LEVEL_2,
        VerificationLevel.LEVEL_3,
        VerificationLevel.LEVEL_4,
        VerificationLevel.LEVEL_5,
        VerificationLevel.LEVEL_6,
      ];
      const currentLevelIndex = levelOrder.indexOf(verification.company.verificationLevel);
      const newLevelIndex = levelOrder.indexOf(verification.level);
      if (newLevelIndex > currentLevelIndex) {
        await this.prisma.company.update({
          where: { id: verification.companyId },
          data: { verificationLevel: verification.level, updatedBy: userId },
        });
      }
    }

    await this.prisma.auditLog.create({
      data: {
        userId,
        action: dto.status === 'APPROVED' ? 'APPROVE_COMPANY_VERIFICATION' : 'REJECT_COMPANY_VERIFICATION',
        resource: `company:${verification.companyId}`,
        metadata: { verificationId, level: verification.level, notes: dto.notes },
      },
    });

    this.logger.log(`Verification ${verificationId} ${dto.status.toLowerCase()} by ${userId}`);
    return updated;
  }

  async findByCompany(companyId: string) {
    const company = await this.prisma.company.findFirst({
      where: { id: companyId, deletedAt: null },
      select: { id: true },
    });
    if (!company) throw new NotFoundException('Company not found');

    return this.prisma.companyVerification.findMany({
      where: { companyId },
      include: {
        documents: true,
        submitter: { select: { id: true, email: true, name: true } },
        reviewer: { select: { id: true, email: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findById(id: string) {
    const verification = await this.prisma.companyVerification.findUnique({
      where: { id },
      include: {
        documents: true,
        submitter: { select: { id: true, email: true, name: true } },
        reviewer: { select: { id: true, email: true, name: true } },
        company: { select: { id: true, name: true, slug: true } },
      },
    });
    if (!verification) throw new NotFoundException('Verification not found');
    return verification;
  }

  async findAll(query: { status?: string; cursor?: string; limit?: number }) {
    const { status, cursor, limit = 20 } = query;
    const where: Prisma.CompanyVerificationWhereInput = {};
    if (status) where.status = status as Prisma.EnumVerificationStatusFilter['equals'];

    const findArgs: Prisma.CompanyVerificationFindManyArgs = {
      where,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        company: { select: { id: true, name: true, slug: true } },
        submitter: { select: { id: true, email: true, name: true } },
        documents: true,
      },
    };
    if (cursor) {
      findArgs.cursor = { id: cursor };
      findArgs.skip = 1;
    }
    const [data, total] = await Promise.all([
      this.prisma.companyVerification.findMany(findArgs),
      this.prisma.companyVerification.count({ where }),
    ]);
    return { data, meta: { total, limit, cursor: data.length > 0 ? data[data.length - 1].id : undefined } };
  }
}
