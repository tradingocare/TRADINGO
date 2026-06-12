import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateCompanyLocationDto } from './dto/create-company-location.dto';
import { UpdateCompanyLocationDto } from './dto/update-company-location.dto';

@Injectable()
export class CompanyLocationsService {
  private readonly logger = new Logger(CompanyLocationsService.name);

  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateCompanyLocationDto, userId: string) {
    const company = await this.prisma.company.findFirst({
      where: { id: dto.companyId, deletedAt: null },
      select: { id: true },
    });
    if (!company) throw new NotFoundException('Company not found');

    if (dto.isPrimary) {
      await this.prisma.companyLocation.updateMany({
        where: { companyId: dto.companyId, isPrimary: true },
        data: { isPrimary: false },
      });
    }

    const location = await this.prisma.companyLocation.create({
      data: {
        companyId: dto.companyId,
        type: dto.type || 'HEAD_OFFICE',
        addressLine1: dto.addressLine1,
        addressLine2: dto.addressLine2,
        city: dto.city,
        district: dto.district,
        state: dto.state,
        country: dto.country || 'India',
        pincode: dto.pincode,
        latitude: dto.latitude,
        longitude: dto.longitude,
        isPrimary: dto.isPrimary ?? false,
      },
    });

    await this.prisma.auditLog.create({
      data: {
        userId,
        action: 'ADD_COMPANY_LOCATION',
        resource: `company:${dto.companyId}`,
        metadata: { locationId: location.id, type: location.type, city: location.city },
      },
    });

    this.logger.log(`Location ${location.id} added to company ${dto.companyId}`);
    return location;
  }

  async findByCompany(companyId: string) {
    const company = await this.prisma.company.findFirst({
      where: { id: companyId, deletedAt: null },
      select: { id: true },
    });
    if (!company) throw new NotFoundException('Company not found');

    return this.prisma.companyLocation.findMany({
      where: { companyId, deletedAt: null },
      orderBy: [{ isPrimary: 'desc' }, { createdAt: 'asc' }],
    });
  }

  async findById(id: string) {
    const location = await this.prisma.companyLocation.findFirst({
      where: { id, deletedAt: null },
    });
    if (!location) throw new NotFoundException('Location not found');
    return location;
  }

  async update(id: string, dto: UpdateCompanyLocationDto, userId: string) {
    const location = await this.prisma.companyLocation.findFirst({
      where: { id, deletedAt: null },
      select: { id: true, companyId: true },
    });
    if (!location) throw new NotFoundException('Location not found');

    if (dto.isPrimary) {
      await this.prisma.companyLocation.updateMany({
        where: { companyId: location.companyId, isPrimary: true, id: { not: id } },
        data: { isPrimary: false },
      });
    }

    const updated = await this.prisma.companyLocation.update({
      where: { id },
      data: dto,
    });

    await this.prisma.auditLog.create({
      data: {
        userId,
        action: 'UPDATE_COMPANY_LOCATION',
        resource: `company:${location.companyId}`,
        metadata: { locationId: id, changes: { ...dto } },
      },
    });

    return updated;
  }

  async remove(id: string, userId: string) {
    const location = await this.prisma.companyLocation.findFirst({
      where: { id, deletedAt: null },
      select: { id: true, companyId: true },
    });
    if (!location) throw new NotFoundException('Location not found');

    await this.prisma.companyLocation.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    await this.prisma.auditLog.create({
      data: {
        userId,
        action: 'DELETE_COMPANY_LOCATION',
        resource: `company:${location.companyId}`,
        metadata: { locationId: id },
      },
    });

    this.logger.log(`Location ${id} soft-deleted by ${userId}`);
  }
}
