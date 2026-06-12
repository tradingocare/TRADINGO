import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateCertificationDto } from './dto/create-certification.dto';
import { UpdateCertificationDto } from './dto/update-certification.dto';

@Injectable()
export class CertificationsService {
  private readonly logger = new Logger(CertificationsService.name);

  constructor(private readonly prisma: PrismaService) {}

  async create(companyId: string, dto: CreateCertificationDto, userId: string) {
    const cert = await this.prisma.companyCertification.create({
      data: {
        companyId,
        type: dto.type,
        documentUrl: dto.documentUrl,
        documentNumber: dto.documentNumber,
        issuedBy: dto.issuedBy,
        issuedAt: dto.issuedAt ? new Date(dto.issuedAt) : null,
        expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : null,
      },
    });

    await this.prisma.auditLog.create({
      data: {
        userId,
        action: 'CREATE_CERTIFICATION',
        resource: `certification:${cert.id}`,
        metadata: { companyId, type: dto.type },
      },
    });

    return cert;
  }

  async findAll(companyId: string) {
    return this.prisma.companyCertification.findMany({
      where: { companyId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findById(id: string) {
    const cert = await this.prisma.companyCertification.findUnique({ where: { id } });
    if (!cert) throw new NotFoundException('Certification not found');
    return cert;
  }

  async update(id: string, dto: UpdateCertificationDto, userId: string) {
    const cert = await this.prisma.companyCertification.findUnique({ where: { id } });
    if (!cert) throw new NotFoundException('Certification not found');

    const updated = await this.prisma.companyCertification.update({
      where: { id },
      data: {
        ...(dto.type !== undefined && { type: dto.type }),
        ...(dto.documentUrl !== undefined && { documentUrl: dto.documentUrl }),
        ...(dto.documentNumber !== undefined && { documentNumber: dto.documentNumber }),
        ...(dto.issuedBy !== undefined && { issuedBy: dto.issuedBy }),
        ...(dto.issuedAt !== undefined && { issuedAt: new Date(dto.issuedAt) }),
        ...(dto.expiresAt !== undefined && { expiresAt: new Date(dto.expiresAt) }),
        ...(dto.status !== undefined && {
          status: dto.status,
          reviewedBy: userId,
          reviewedAt: new Date(),
        }),
        ...(dto.notes !== undefined && { notes: dto.notes }),
      },
    });

    await this.prisma.auditLog.create({
      data: {
        userId,
        action: 'UPDATE_CERTIFICATION',
        resource: `certification:${id}`,
        metadata: { companyId: cert.companyId, changes: { ...dto } },
      },
    });

    return updated;
  }

  async remove(id: string, userId: string) {
    const cert = await this.prisma.companyCertification.findUnique({ where: { id } });
    if (!cert) throw new NotFoundException('Certification not found');

    await this.prisma.companyCertification.delete({ where: { id } });

    await this.prisma.auditLog.create({
      data: {
        userId,
        action: 'DELETE_CERTIFICATION',
        resource: `certification:${id}`,
        metadata: { companyId: cert.companyId },
      },
    });
  }

  async expireOutdated(): Promise<number> {
    const now = new Date();
    const expired = await this.prisma.companyCertification.updateMany({
      where: { expiresAt: { lte: now }, status: { not: 'EXPIRED' } },
      data: { status: 'EXPIRED' },
    });
    if (expired.count > 0) {
      this.logger.log(`Expired ${expired.count} certifications`);
    }
    return expired.count;
  }

  async review(id: string, status: 'APPROVED' | 'REJECTED', notes: string | undefined, userId: string) {
    const cert = await this.prisma.companyCertification.findUnique({ where: { id } });
    if (!cert) throw new NotFoundException('Certification not found');

    return this.prisma.companyCertification.update({
      where: { id },
      data: {
        status,
        reviewedBy: userId,
        reviewedAt: new Date(),
        notes: notes,
      },
    });
  }
}
