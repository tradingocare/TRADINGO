import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class QaService {
  constructor(private readonly prisma: PrismaService) {}

  async askQuestion(productId: string, userId: string, question: string) {
    return this.prisma.productQa.create({
      data: { productId, askedBy: userId, question },
    });
  }

  async answerQuestion(qaId: string, companyId: string, answer: string) {
    try {
      return await this.prisma.productQa.update({
        where: { id: qaId },
        data: { companyId, answer, answeredAt: new Date() },
      });
    } catch {
      throw new NotFoundException('Question not found');
    }
  }

  async getQuestions(productId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [raw, total] = await Promise.all([
      this.prisma.productQa.findMany({
        where: { productId },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.productQa.count({ where: { productId } }),
    ]);
    const userIds = raw.map((q) => q.askedBy).filter(Boolean);
    const users = userIds.length > 0
      ? await this.prisma.user.findMany({ where: { id: { in: userIds } }, select: { id: true, name: true } })
      : [];
    const userMap = new Map(users.map((u) => [u.id, u.name]));
    return {
      data: raw.map((q) => ({
        id: q.id,
        question: q.question,
        answer: q.answer,
        askedBy: userMap.get(q.askedBy) || 'Anonymous',
        answeredAt: q.answeredAt,
        createdAt: q.createdAt,
      })),
      total,
    };
  }

  async getMyQuestions(userId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.prisma.productQa.findMany({
        where: { askedBy: userId },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: { product: true },
      }),
      this.prisma.productQa.count({ where: { askedBy: userId } }),
    ]);
    return {
      data,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }
}
