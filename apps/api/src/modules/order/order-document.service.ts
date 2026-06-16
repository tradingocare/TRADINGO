import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateOrderDocumentDto } from './dto/order.dto';

@Injectable()
export class OrderDocumentService {
  constructor(private readonly prisma: PrismaService) {}

  async upload(orderId: string, uploadedBy: string, dto: CreateOrderDocumentDto) {
    const order = await this.prisma.order.findUnique({ where: { id: orderId } });
    if (!order) throw new NotFoundException('Order not found');

    const latestVersion = await this.prisma.orderDocument.findFirst({
      where: { orderId, docType: dto.docType },
      orderBy: { version: 'desc' },
      select: { version: true },
    });

    return this.prisma.orderDocument.create({
      data: {
        orderId,
        docType: dto.docType,
        fileName: dto.fileName,
        fileUrl: dto.fileUrl,
        mimeType: dto.mimeType ?? null,
        fileSize: dto.fileSize ?? null,
        version: (latestVersion?.version ?? 0) + 1,
        uploadedBy,
      },
    });
  }

  async getDocuments(orderId: string) {
    return this.prisma.orderDocument.findMany({
      where: { orderId },
      orderBy: [{ docType: 'asc' }, { version: 'desc' }],
    });
  }

  async deleteDocument(documentId: string, userId: string) {
    const doc = await this.prisma.orderDocument.findUnique({ where: { id: documentId } });
    if (!doc) throw new NotFoundException('Document not found');
    if (doc.uploadedBy !== userId) throw new BadRequestException('Can only delete own documents');

    await this.prisma.orderDocument.delete({ where: { id: documentId } });
    return { message: 'Document deleted' };
  }
}
