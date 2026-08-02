import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class UserPreferenceService {
  private readonly logger = new Logger(UserPreferenceService.name);

  constructor(private readonly prisma: PrismaService) {}

  async getPreferences(userId: string) {
    return this.prisma.userPreference.findUnique({ where: { userId } });
  }

  async upsert(userId: string, data: Record<string, unknown>) {
    return this.prisma.userPreference.upsert({
      where: { userId },
      update: data as any,
      create: { userId, ...data } as any,
    });
  }
}
