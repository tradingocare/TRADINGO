import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { FileScanStatus } from '@prisma/client';

@Injectable()
export class FileScanService {
  private readonly logger = new Logger(FileScanService.name);

  constructor(private readonly prisma: PrismaService) {}

  async createScanRecord(data: {
    fileUrl: string;
    originalName?: string;
    mimeType?: string;
    fileSize?: number;
    companyId?: string;
    uploadedBy?: string;
  }) {
    return this.prisma.fileScan.create({
      data: {
        fileUrl: data.fileUrl,
        originalName: data.originalName,
        mimeType: data.mimeType,
        fileSize: data.fileSize,
        status: 'PENDING',
        companyId: data.companyId,
        uploadedBy: data.uploadedBy,
      },
    });
  }

  async scanFile(scanId: string): Promise<{ clean: boolean; result: any }> {
    const scan = await this.prisma.fileScan.findUnique({ where: { id: scanId } });
    if (!scan) throw new Error('Scan record not found');

    await this.prisma.fileScan.update({
      where: { id: scanId },
      data: { status: 'SCANNING' },
    });

    // TODO: Integrate with ClamAV or other antivirus service
    this.logger.log(`Scanning file: ${scan.fileUrl}`);

    const result = { clean: true, threats: [] };
    await this.updateScanResult(scanId, 'CLEAN', result);

    return { clean: true, result };
  }

  async updateScanResult(scanId: string, status: FileScanStatus, scanResult?: any) {
    return this.prisma.fileScan.update({
      where: { id: scanId },
      data: {
        status,
        scanResult: scanResult ?? undefined,
        scannedAt: ['CLEAN', 'INFECTED', 'FAILED'].includes(status) ? new Date() : undefined,
      },
    });
  }

  async isFileAllowed(scanId: string): Promise<boolean> {
    const scan = await this.prisma.fileScan.findUnique({ where: { id: scanId } });
    if (!scan) return false;
    return scan.status === 'CLEAN';
  }

  async blockFile(scanId: string) {
    return this.updateScanResult(scanId, 'INFECTED', { blocked: true, blockedAt: new Date() });
  }

  async approveFile(scanId: string) {
    return this.updateScanResult(scanId, 'CLEAN', { approved: true, approvedAt: new Date() });
  }
}
