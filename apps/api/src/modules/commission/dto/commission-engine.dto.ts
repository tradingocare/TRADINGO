import { IsString, IsOptional, IsNumber, IsBoolean, Min, IsIn, IsDateString } from 'class-validator';
import { Type } from 'class-transformer';

export class CommissionCalculationResult {
  grossAmount: number;
  commissionType: string;
  commissionValue: number;
  platformCommission: number;
  netSettlementAmount: number;
  appliedRule: {
    id: string;
    ruleType: string;
    name: string | null;
    priority: number;
  } | null;
  ruleSource: string;
  calculationTimestamp: Date;
}

export class CalculateCommissionDto {
  @IsNumber()
  @Min(0)
  amount!: number;

  @IsOptional()
  @IsString()
  bookingId?: string;

  @IsOptional()
  @IsString()
  professionalCompanyId?: string;

  @IsOptional()
  @IsString()
  categoryId?: string;

  @IsOptional()
  @IsString()
  membershipPlanId?: string;
}

export class CreateCommissionEngineRuleDto {
  @IsOptional()
  @IsString()
  categoryId?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  minAmount?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  maxAmount?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  percent?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  fixedFee?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  tdsPercent?: number;

  @IsOptional()
  @IsBoolean()
  gstOnCommission?: boolean;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsDateString()
  startsAt?: string;

  @IsOptional()
  @IsDateString()
  endsAt?: string;

  @IsString()
  @IsIn(['PLATFORM_DEFAULT', 'CATEGORY', 'MEMBERSHIP', 'PROFESSIONAL', 'PROMOTIONAL'])
  ruleType!: string;

  @IsOptional()
  @IsString()
  @IsIn(['PERCENTAGE', 'FIXED', 'ZERO'])
  calcType?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  priority?: number;

  @IsOptional()
  @IsString()
  scope?: string;

  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  professionalId?: string;

  @IsOptional()
  @IsString()
  membershipPlanId?: string;
}

export class UpdateCommissionEngineRuleDto {
  @IsOptional()
  @IsString()
  categoryId?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  minAmount?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  maxAmount?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  percent?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  fixedFee?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  tdsPercent?: number;

  @IsOptional()
  @IsBoolean()
  gstOnCommission?: boolean;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsDateString()
  startsAt?: string;

  @IsOptional()
  @IsDateString()
  endsAt?: string;

  @IsOptional()
  @IsString()
  @IsIn(['PLATFORM_DEFAULT', 'CATEGORY', 'MEMBERSHIP', 'PROFESSIONAL', 'PROMOTIONAL'])
  ruleType?: string;

  @IsOptional()
  @IsString()
  @IsIn(['PERCENTAGE', 'FIXED', 'ZERO'])
  calcType?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  priority?: number;

  @IsOptional()
  @IsString()
  scope?: string;

  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  professionalId?: string;

  @IsOptional()
  @IsString()
  membershipPlanId?: string;
}

export class QueryCommissionEngineRuleDto {
  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  isActive?: boolean;

  @IsOptional()
  @IsString()
  categoryId?: string;

  @IsOptional()
  @IsString()
  @IsIn(['PLATFORM_DEFAULT', 'CATEGORY', 'MEMBERSHIP', 'PROFESSIONAL', 'PROMOTIONAL'])
  ruleType?: string;

  @IsOptional()
  @IsString()
  scope?: string;

  @IsOptional()
  @IsString()
  professionalId?: string;

  @IsOptional()
  @IsString()
  membershipPlanId?: string;

  @IsOptional()
  @Type(() => Number)
  page?: number;

  @IsOptional()
  @Type(() => Number)
  limit?: number;
}

export class CommissionEngineSummaryDto {
  totalRules: number;
  rulesByType: Record<string, number>;
  platformDefault: number;
  membershipRules: number;
  professionalRules: number;
  promotionalRules: number;
  categoryRules: number;
  totalCommissionCollected: number;
}
