import { Injectable, NotFoundException, ConflictException, ForbiddenException, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { SubmitUserVerificationDto } from './dto/submit-user-verification.dto';
import { ReviewUserVerificationDto } from './dto/review-user-verification.dto';
import { Role } from '../../common/enums/role.enum';
import { Prisma, VerificationLevel } from '@prisma/client';

@Injectable()
export class UserVerificationService {
  private readonly logger = new Logger(UserVerificationService.name);

  constructor(private readonly prisma: PrismaService) {}

  async submit(dto: SubmitUserVerificationDto, userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, verificationLevel: true, deletedAt: true },
    });
    if (!user || user.deletedAt) throw new NotFoundException('User not found');

    const existingPending = await this.prisma.userVerification.findFirst({
      where: { userId, status: 'PENDING' },
      select: { id: true },
    });
    if (existingPending) throw new ConflictException('A verification request is already pending for this user');

    const verification = await this.prisma.userVerification.create({
      data: {
        userId,
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
        action: 'SUBMIT_USER_VERIFICATION',
        resource: `user:${userId}`,
        metadata: { verificationId: verification.id, level: dto.level },
      },
    });

    this.logger.log(`User verification ${verification.id} submitted for user ${userId}`);
    return verification;
  }

  async review(verificationId: string, dto: ReviewUserVerificationDto, userId: string) {
    const reviewer = await this.prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
    if (!reviewer || (reviewer.role !== Role.SUPER_ADMIN && reviewer.role !== Role.ADMIN)) {
      throw new ForbiddenException('Only admins can review user verifications');
    }

    const verification = await this.prisma.userVerification.findUnique({
      where: { id: verificationId },
      include: {
        user: { select: { id: true, verificationLevel: true } },
      },
    });
    if (!verification) throw new NotFoundException('User verification not found');
    if (verification.status !== 'PENDING') throw new ConflictException('Verification has already been reviewed');

    const updated = await this.prisma.userVerification.update({
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
        VerificationLevel.LEVEL_7,
        VerificationLevel.LEVEL_8,
      ];
      const currentLevelIndex = levelOrder.indexOf(verification.user.verificationLevel);
      const newLevelIndex = levelOrder.indexOf(verification.level);
      if (newLevelIndex > currentLevelIndex) {
        await this.prisma.user.update({
          where: { id: verification.userId },
          data: { verificationLevel: verification.level },
        });
      }
    }

    await this.prisma.auditLog.create({
      data: {
        userId,
        action: dto.status === 'APPROVED' ? 'APPROVE_USER_VERIFICATION' : 'REJECT_USER_VERIFICATION',
        resource: `user:${verification.userId}`,
        metadata: { verificationId, level: verification.level, notes: dto.notes },
      },
    });

    this.logger.log(`User verification ${verificationId} ${dto.status.toLowerCase()} by ${userId}`);
    return updated;
  }

  async findByUser(userId: string) {
    const user = await this.prisma.user.findFirst({
      where: { id: userId, deletedAt: null },
      select: { id: true },
    });
    if (!user) throw new NotFoundException('User not found');

    const records = await this.prisma.userVerification.findMany({
      where: { userId },
      include: {
        documents: true,
        submitter: { select: { id: true, email: true, name: true } },
        reviewer: { select: { id: true, email: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    return this.maskSensitiveFields(records);
  }

  async findById(id: string) {
    const verification = await this.prisma.userVerification.findUnique({
      where: { id },
      include: {
        documents: true,
        submitter: { select: { id: true, email: true, name: true } },
        reviewer: { select: { id: true, email: true, name: true } },
        user: { select: { id: true, email: true, name: true } },
      },
    });
    if (!verification) throw new NotFoundException('User verification not found');
    return this.maskSensitiveFields(verification);
  }

  /**
   * P0-1: cross-tenant read eliminated. Non-admin callers may only read their
   * OWN verification (submittedBy/user matches); any other id resolves to 404.
   * Admins retain full access.
   */
  async findAuthorizedById(id: string, userId: string, role: string) {
    const verification = await this.prisma.userVerification.findUnique({
      where: { id },
      include: {
        documents: true,
        submitter: { select: { id: true, email: true, name: true } },
        reviewer: { select: { id: true, email: true, name: true } },
        user: { select: { id: true, email: true, name: true } },
      },
    });
    if (!verification) throw new NotFoundException('User verification not found');

    if (role !== Role.SUPER_ADMIN && role !== Role.ADMIN && verification.userId !== userId) {
      throw new NotFoundException('User verification not found');
    }

    return this.maskSensitiveFields(verification);
  }

  /**
   * P0-1: serves a sensitive document to authorized eyes only. ADMIN/SUPER_ADMIN
   * or the verification's own user pass; all others 403/404.
   */
  async getDocumentForAuthorizedAccess(
    verificationId: string,
    documentId: string,
    userId: string,
    role: string,
  ): Promise<{ documentUrl: string }> {
    const verification = await this.prisma.userVerification.findUnique({
      where: { id: verificationId },
      select: { userId: true },
    });
    if (!verification) throw new NotFoundException('User verification not found');

    if (role !== Role.SUPER_ADMIN && role !== Role.ADMIN && verification.userId !== userId) {
      throw new NotFoundException('User verification not found');
    }

    const document = await this.prisma.userVerificationDocument.findUnique({
      where: { id: documentId },
      select: { documentUrl: true, verificationId: true },
    });
    if (!document || document.verificationId !== verificationId) {
      throw new NotFoundException('Document not found');
    }

    return { documentUrl: document.documentUrl };
  }

  async findAll(query: { status?: string; cursor?: string; limit?: number }) {
    const { status, cursor, limit = 20 } = query;
    const where: Prisma.UserVerificationWhereInput = {};
    if (status) where.status = status as Prisma.EnumVerificationStatusFilter['equals'];

    const findArgs: Prisma.UserVerificationFindManyArgs = {
      where,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { id: true, email: true, name: true } },
        submitter: { select: { id: true, email: true, name: true } },
        documents: true,
      },
    };
    if (cursor) {
      findArgs.cursor = { id: cursor };
      findArgs.skip = 1;
    }
    const [data, total] = await Promise.all([
      this.prisma.userVerification.findMany(findArgs),
      this.prisma.userVerification.count({ where }),
    ]);
    return { data, meta: { total, limit, cursor: data.length > 0 ? data[data.length - 1].id : undefined } };
  }

  private maskSensitiveFields(data: any) {
    if (!data) return data;
    if (Array.isArray(data)) return data.map((item) => this.maskDocumentUrls(item));
    return this.maskDocumentUrls(data);
  }

  // P0-1: every sensitive identity/bank/compliance document type in the REAL
  // DocumentType enum is masked. The previous list used non-existent enum
  // values ('GST_CERTIFICATE'/'BANK_STATEMENT'), so GST/cheque/bank docs were
  // never masked. Mirrors the company-verification remediation.
  private static readonly SENSITIVE_DOC_TYPES = new Set([
    'PAN',
    'GST',
    'AADHAAR',
    'BUSINESS_REGISTRATION',
    'CANCELLED_CHEQUE',
    'BANK_VERIFICATION',
    'LIABILITY_INSURANCE',
    'PROFESSIONAL_MEMBERSHIP',
    'CLIENT_REFERENCE',
    'EXPERIENCE_LETTER',
  ]);

  private maskDocumentUrls(record: any) {
    if (!record?.documents) return record;
    return {
      ...record,
      documents: record.documents.map((doc: any) => {
        if (UserVerificationService.SENSITIVE_DOC_TYPES.has(doc.documentType?.toUpperCase?.() ?? doc.documentType)) {
          return { ...doc, documentUrl: '[MASKED]' };
        }
        return doc;
      }),
    };
  }
}
