import { Controller, Get, Post, Patch, Delete, Param, Body, Query, UseGuards, NotFoundException } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { PrismaService } from '../../prisma/prisma.service';
import { CommissionService } from './commission.service';
import { CommissionEngineService } from './commission-engine.service';
import { CreateCommissionRuleDto, UpdateCommissionRuleDto, QueryCommissionRuleDto } from './dto/commission.dto';
import {
  CreateCommissionEngineRuleDto,
  UpdateCommissionEngineRuleDto,
  QueryCommissionEngineRuleDto,
  CalculateCommissionDto,
} from './dto/commission-engine.dto';

@Throttle({ default: { limit: 30, ttl: 60000 } })
@Controller()
export class CommissionController {
  constructor(
    private readonly commissionService: CommissionService,
    private readonly commissionEngine: CommissionEngineService,
    private readonly prisma: PrismaService,
  ) {}

  // Legacy Commission endpoints (order-based, unchanged)
  @Post('commission/calculate')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  async calculate(@Body() body: { amount: number; categoryId?: string }) {
    return this.commissionService.calculate(body.amount, body.categoryId);
  }

  @Get('commission/rules')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  async listRules(@Query() query: QueryCommissionRuleDto) {
    return this.commissionService.listRules(query);
  }

  @Post('commission/rules')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  async createRule(@Body() dto: CreateCommissionRuleDto) {
    return this.commissionService.createRule(dto);
  }

  @Get('commission/rules/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  async getRule(@Param('id') id: string) {
    return this.commissionService.getRule(id);
  }

  @Patch('commission/rules/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  async updateRule(@Param('id') id: string, @Body() dto: UpdateCommissionRuleDto) {
    return this.commissionService.updateRule(id, dto);
  }

  @Delete('commission/rules/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  async deleteRule(@Param('id') id: string) {
    return this.commissionService.deleteRule(id);
  }

  @Get('commission/summary')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  async getSummary() {
    return this.commissionService.getSummary();
  }

  // Commission Engine endpoints (booking-based, Sprint 6H)
  @Post('commission/engine/calculate')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  async engineCalculate(@Body() dto: CalculateCommissionDto) {
    return this.commissionEngine.calculate(
      dto.amount,
      dto.professionalCompanyId,
      dto.categoryId,
      dto.membershipPlanId,
    );
  }

  @Get('commission/engine/rules')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  async listEngineRules(@Query() query: QueryCommissionEngineRuleDto) {
    const where: any = {};

    if (query.isActive !== undefined) where.isActive = query.isActive;
    if (query.categoryId) where.categoryId = query.categoryId;
    if (query.ruleType) where.ruleType = query.ruleType;
    if (query.scope) where.scope = query.scope;
    if (query.professionalId) where.professionalId = query.professionalId;
    if (query.membershipPlanId) where.membershipPlanId = query.membershipPlanId;

    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.prisma.commissionRule.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
      }),
      this.prisma.commissionRule.count({ where }),
    ]);

    return { data, meta: { total, page, limit, totalPages: Math.ceil(total / limit), hasNext: skip + limit < total, hasPrevious: page > 1 } };
  }

  @Post('commission/engine/rules')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  async createEngineRule(@Body() dto: CreateCommissionEngineRuleDto) {
    const rule = await this.prisma.commissionRule.create({
      data: {
        categoryId: dto.categoryId,
        minAmount: dto.minAmount,
        maxAmount: dto.maxAmount,
        percent: dto.percent ?? 0,
        fixedFee: dto.fixedFee ?? 0,
        tdsPercent: dto.tdsPercent ?? 0,
        gstOnCommission: dto.gstOnCommission ?? true,
        isActive: dto.isActive ?? true,
        startsAt: dto.startsAt ? new Date(dto.startsAt) : new Date(),
        endsAt: dto.endsAt ? new Date(dto.endsAt) : null,
        ruleType: dto.ruleType as any,
        calcType: (dto.calcType ?? 'PERCENTAGE') as any,
        priority: dto.priority ?? 0,
        scope: dto.scope ?? 'BOOKING',
        name: dto.name,
        description: dto.description,
        professionalId: dto.professionalId,
        membershipPlanId: dto.membershipPlanId,
      },
    });

    await this.prisma.auditLog.create({
      data: {
        action: 'COMMISSION_ENGINE_RULE_CREATED',
        resource: `commission-engine-rule:${rule.id}`,
        metadata: {
          ruleType: dto.ruleType,
          calcType: dto.calcType,
          priority: dto.priority,
          percent: dto.percent,
          fixedFee: dto.fixedFee,
        },
      },
    });

    return rule;
  }

  @Patch('commission/engine/rules/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  async updateEngineRule(@Param('id') id: string, @Body() dto: UpdateCommissionEngineRuleDto) {
    const rule = await this.prisma.commissionRule.findUnique({ where: { id } });
    if (!rule) throw new NotFoundException('Commission engine rule not found');

    const data: any = {};
    if (dto.categoryId !== undefined) data.categoryId = dto.categoryId;
    if (dto.minAmount !== undefined) data.minAmount = dto.minAmount;
    if (dto.maxAmount !== undefined) data.maxAmount = dto.maxAmount;
    if (dto.percent !== undefined) data.percent = dto.percent;
    if (dto.fixedFee !== undefined) data.fixedFee = dto.fixedFee;
    if (dto.tdsPercent !== undefined) data.tdsPercent = dto.tdsPercent;
    if (dto.gstOnCommission !== undefined) data.gstOnCommission = dto.gstOnCommission;
    if (dto.isActive !== undefined) data.isActive = dto.isActive;
    if (dto.startsAt !== undefined) data.startsAt = new Date(dto.startsAt);
    if (dto.endsAt !== undefined) data.endsAt = dto.endsAt ? new Date(dto.endsAt) : null;
    if (dto.ruleType !== undefined) data.ruleType = dto.ruleType;
    if (dto.calcType !== undefined) data.calcType = dto.calcType;
    if (dto.priority !== undefined) data.priority = dto.priority;
    if (dto.scope !== undefined) data.scope = dto.scope;
    if (dto.name !== undefined) data.name = dto.name;
    if (dto.description !== undefined) data.description = dto.description;
    if (dto.professionalId !== undefined) data.professionalId = dto.professionalId;
    if (dto.membershipPlanId !== undefined) data.membershipPlanId = dto.membershipPlanId;

    const updated = await this.prisma.commissionRule.update({ where: { id }, data });

    await this.prisma.auditLog.create({
      data: {
        action: 'COMMISSION_ENGINE_RULE_UPDATED',
        resource: `commission-engine-rule:${id}`,
        metadata: { changes: Object.keys(data) },
      },
    });

    return updated;
  }

  @Delete('commission/engine/rules/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  async deleteEngineRule(@Param('id') id: string) {
    const rule = await this.prisma.commissionRule.findUnique({ where: { id } });
    if (!rule) throw new NotFoundException('Commission engine rule not found');

    await this.prisma.commissionRule.delete({ where: { id } });

    await this.prisma.auditLog.create({
      data: {
        action: 'COMMISSION_ENGINE_RULE_DELETED',
        resource: `commission-engine-rule:${id}`,
        metadata: { ruleType: rule.ruleType, name: rule.name },
      },
    });
  }

  @Get('commission/engine/rules/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  async getEngineRule(@Param('id') id: string) {
    const rule = await this.prisma.commissionRule.findUnique({ where: { id } });
    if (!rule) throw new NotFoundException('Commission engine rule not found');
    return rule;
  }

  @Get('commission/engine/summary')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  async getEngineSummary() {
    const rules = await this.prisma.commissionRule.findMany({ where: { isActive: true } });

    const rulesByType: Record<string, number> = {};
    for (const rule of rules) {
      const t = rule.ruleType;
      rulesByType[t] = (rulesByType[t] || 0) + 1;
    }

    return {
      totalRules: rules.length,
      rulesByType,
      platformDefault: rules.filter((r) => r.ruleType === 'PLATFORM_DEFAULT').length,
      membershipRules: rules.filter((r) => r.ruleType === 'MEMBERSHIP').length,
      professionalRules: rules.filter((r) => r.ruleType === 'PROFESSIONAL').length,
      promotionalRules: rules.filter((r) => r.ruleType === 'PROMOTIONAL').length,
      categoryRules: rules.filter((r) => r.ruleType === 'CATEGORY').length,
      totalCommissionCollected: 0,
    };
  }
}
