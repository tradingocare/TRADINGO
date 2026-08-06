import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AdminSettingsService {
  constructor(private readonly prisma: PrismaService) {}

  async getAll() {
    const settings = await this.prisma.appSetting.findMany({ orderBy: { key: 'asc' } });
    const result: Record<string, unknown> = {};
    for (const s of settings) {
      result[s.key] = s.value;
    }
    return { data: result };
  }

  async get(key: string) {
    const setting = await this.prisma.appSetting.findUnique({ where: { key } });
    if (!setting) throw new NotFoundException(`Setting "${key}" not found`);
    return { data: { key: setting.key, value: setting.value } };
  }

  async update(key: string, value: unknown) {
    const setting = await this.prisma.appSetting.upsert({
      where: { key },
      create: { key, value: value as any },
      update: { value: value as any },
    });
    return { data: { key: setting.key, value: setting.value } };
  }

  async updateBatch(settings: Record<string, unknown>) {
    const results: Array<{ key: string; value: unknown }> = [];
    for (const [key, value] of Object.entries(settings)) {
      const setting = await this.prisma.appSetting.upsert({
        where: { key },
        create: { key, value: value as any },
        update: { value: value as any },
      });
      results.push({ key: setting.key, value: setting.value });
    }
    return { data: results };
  }
}
