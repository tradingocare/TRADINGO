import { IsString, IsNumber, IsOptional, IsEnum, Min } from 'class-validator';
import { GOCASH_RedemptionType } from '@prisma/client';

export class RedeemDto {
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  amount: number;

  @IsEnum(GOCASH_RedemptionType)
  redemptionType: GOCASH_RedemptionType;

  @IsOptional()
  @IsString()
  reference?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class ReverseDto {
  @IsString()
  reason: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class RejectRedemptionDto {
  @IsString()
  reason: string;
}
