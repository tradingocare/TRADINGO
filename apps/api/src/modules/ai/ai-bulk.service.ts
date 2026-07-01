import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { BulkEnhancementDto } from './dto/ai.dto';
import { AiJobType, AiJobStatus } from '@prisma/client';

@Injectable()
export class AiBulkService {
  private readonly logger = new Logger(AiBulkService.name);

  constructor(private readonly prisma: PrismaService) {}

  async createBulkJob(dto: BulkEnhancementDto, companyId: string, userId: string) {
    const jobs = await Promise.all(dto.productIds.map(productId =>
      this.prisma.aiJob.create({
        data: { productId, companyId, jobType: AiJobType.BULK_ENHANCEMENT, status: AiJobStatus.PENDING, payload: { jobTypes: dto.jobTypes, options: dto.options || {} } as any },
      })
    ));
    return { jobsCreated: jobs.length, jobIds: jobs.map(j => j.id) };
  }

  async listJobs(companyId: string, page = 1, limit = 20) {
    const [data, total] = await Promise.all([
      this.prisma.aiJob.findMany({ where: { companyId }, skip: (page - 1) * limit, take: limit, orderBy: { createdAt: 'desc' }, include: { product: { select: { id: true, name: true, slug: true } } } }),
      this.prisma.aiJob.count({ where: { companyId } }),
    ]);
    return { data, meta: { total, page, limit, totalPages: Math.ceil(total / limit), hasNext: page * limit < total, hasPrevious: page > 1 } };
  }

  async getJobStats(companyId?: string) {
    const where: any = {};
    if (companyId) where.companyId = companyId;
    const [total, pending, processing, completed, failed] = await Promise.all([
      this.prisma.aiJob.count({ where }),
      this.prisma.aiJob.count({ where: { ...where, status: AiJobStatus.PENDING } }),
      this.prisma.aiJob.count({ where: { ...where, status: AiJobStatus.PROCESSING } }),
      this.prisma.aiJob.count({ where: { ...where, status: AiJobStatus.COMPLETED } }),
      this.prisma.aiJob.count({ where: { ...where, status: AiJobStatus.FAILED } }),
    ]);
    return { total, pending, processing, completed, failed };
  }
}
