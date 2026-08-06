import { IsString, IsOptional, IsNumber, IsBoolean, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateCommissionRuleDto {
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

  @IsNumber()
  @Min(0)
  percent!: number;

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
  @IsString()
  startsAt?: string;

  @IsOptional()
  @IsString()
  endsAt?: string;
}

export class UpdateCommissionRuleDto {
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
  @IsString()
  startsAt?: string;

  @IsOptional()
  @IsString()
  endsAt?: string;
}

export class QueryCommissionRuleDto {
  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  isActive?: boolean;

  @IsOptional()
  @IsString()
  categoryId?: string;

  @IsOptional()
  @Type(() => Number)
  page?: number;

  @IsOptional()
  @Type(() => Number)
  limit?: number;
}
