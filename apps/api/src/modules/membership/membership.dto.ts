import { IsString, IsOptional, IsNumber, IsEnum, IsBoolean, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { PlanVisibility } from '@prisma/client';

export class ValidateCouponDto {
  @IsString()
  code: string;

  @IsString()
  planId: string;

  @IsString()
  companyId: string;
}

export class ValidateReferralDto {
  @IsString()
  code: string;

  @IsString()
  refereeCompanyId: string;
}

export class CreateOrderDto {
  @IsString()
  planId: string;

  @IsString()
  planTier: string;

  @IsNumber()
  @Min(1)
  @Max(3)
  duration: number;

  @IsOptional()
  @IsString()
  couponCode?: string;

  @IsOptional()
  @IsString()
  referralCode?: string;
}

export class ProcessPaymentDto {
  @IsString()
  orderId: string;

  @IsString()
  gateway: string;

  @IsOptional()
  paymentData: any;
}

export class CancelSubscriptionDto {
  @IsOptional()
  @IsString()
  reason?: string;
}

export class PlanHistoryQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  limit?: number;
}

// Admin DTOs
export class AdminCreatePlanDto {
  @IsString()
  planId: string;

  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsNumber()
  @Min(0)
  pricePlanA: number;

  @IsNumber()
  @Min(0)
  pricePlanB: number;

  @IsNumber()
  @Min(0)
  pricePlanC: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  duration?: number;

  @IsOptional()
  @IsNumber()
  sortOrder?: number;

  @IsOptional()
  @IsEnum(PlanVisibility)
  visibility?: PlanVisibility;

  @IsOptional()
  @IsBoolean()
  isFree?: boolean;

  @IsOptional()
  @IsString()
  badgeText?: string;

  @IsOptional()
  countryPricing?: any;

  @IsOptional()
  upgradeRules?: any;

  @IsOptional()
  downgradeRules?: any;

  @IsOptional()
  @IsNumber()
  gracePeriodDays?: number;

  @IsOptional()
  renewalRules?: any;

  @IsOptional()
  @IsNumber()
  trialPeriodDays?: number;

  @IsOptional()
  @IsString()
  launchOfferEndsAt?: string;

  @IsOptional()
  metadata?: any;

  @IsOptional()
  features?: string[];
}

export class AdminUpdatePlanDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  pricePlanA?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  pricePlanB?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  pricePlanC?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  duration?: number;

  @IsOptional()
  @IsNumber()
  sortOrder?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsEnum(PlanVisibility)
  visibility?: PlanVisibility;

  @IsOptional()
  @IsBoolean()
  isFree?: boolean;

  @IsOptional()
  @IsString()
  badgeText?: string;

  @IsOptional()
  countryPricing?: any;

  @IsOptional()
  upgradeRules?: any;

  @IsOptional()
  downgradeRules?: any;

  @IsOptional()
  @IsNumber()
  gracePeriodDays?: number;

  @IsOptional()
  renewalRules?: any;

  @IsOptional()
  @IsNumber()
  trialPeriodDays?: number;

  @IsOptional()
  @IsString()
  launchOfferEndsAt?: string;

  @IsOptional()
  metadata?: any;
}

export class AdminUpsertPlanFeatureDto {
  @IsOptional()
  @IsString()
  id?: string;

  @IsOptional()
  @IsString()
  category?: string;

  @IsString()
  feature: string;

  @IsOptional()
  @IsBoolean()
  included?: boolean;

  @IsOptional()
  @IsString()
  value?: string;

  @IsOptional()
  @IsNumber()
  sortOrder?: number;
}

export class AdminCreatePlanAddonDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsNumber()
  @Min(0)
  price: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  duration?: number;

  @IsOptional()
  @IsNumber()
  sortOrder?: number;
}
