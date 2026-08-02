import { IsString, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';

export class CreatePayoutAccountDto {
  @IsOptional()
  @IsString()
  bankAccount?: string;

  @IsOptional()
  @IsString()
  ifscCode?: string;

  @IsOptional()
  @IsString()
  upiId?: string;

  @IsOptional()
  @IsString()
  fundAccountId?: string;

  @IsOptional()
  @IsString()
  contactId?: string;

  @IsOptional()
  @IsString()
  accountHolderName?: string;
}

export class UpdatePayoutAccountDto {
  @IsOptional()
  @IsString()
  bankAccount?: string;

  @IsOptional()
  @IsString()
  ifscCode?: string;

  @IsOptional()
  @IsString()
  upiId?: string;

  @IsOptional()
  @IsString()
  fundAccountId?: string;
}

export class QueryPayoutDto {
  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @Type(() => Number)
  page?: number;

  @IsOptional()
  @Type(() => Number)
  limit?: number;
}
