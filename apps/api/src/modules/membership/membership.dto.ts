import { IsString, IsOptional, IsNumber, IsEnum, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { SubscriptionStatus, PlanChangeType } from '@prisma/client';

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
