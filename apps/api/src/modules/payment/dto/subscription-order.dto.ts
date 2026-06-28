import { IsString, IsInt, IsOptional, Min } from 'class-validator';

export class CreateSubscriptionOrderDto {
  @IsString()
  planId: string;

  @IsString()
  planTier: string;

  @IsInt()
  @Min(1)
  duration: number;

  @IsOptional()
  @IsString()
  couponCode?: string;

  @IsOptional()
  @IsString()
  referralCode?: string;

  @IsOptional()
  @IsString()
  gateway?: string;
}

export class VerifySubscriptionPaymentDto {
  @IsString()
  paymentId: string;

  @IsString()
  gatewayPaymentId: string;

  @IsString()
  gatewaySignature: string;

  @IsOptional()
  @IsString()
  gateway?: string;
}
