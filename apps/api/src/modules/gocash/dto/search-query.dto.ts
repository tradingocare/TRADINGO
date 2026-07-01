import { IsString, IsNumber, IsOptional, IsEnum, IsDateString, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { GOCASHLedgerDirection, GOCASHLedgerStatus, GOCASHTransactionType } from '@prisma/client';

export class SearchQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  limit?: number = 20;

  @IsOptional()
  @IsString()
  search?: string;
}

export class LedgerQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  limit?: number = 50;

  @IsOptional()
  @IsEnum(GOCASHLedgerDirection)
  direction?: GOCASHLedgerDirection;

  @IsOptional()
  @IsEnum(GOCASHLedgerStatus)
  status?: GOCASHLedgerStatus;

  @IsOptional()
  @IsEnum(GOCASHTransactionType)
  type?: GOCASHTransactionType;

  @IsOptional()
  @IsDateString()
  from?: string;

  @IsOptional()
  @IsDateString()
  to?: string;

  @IsOptional()
  @IsString()
  referenceId?: string;
}
