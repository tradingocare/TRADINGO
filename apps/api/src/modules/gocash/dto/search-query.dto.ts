import { IsString, IsNumber, IsOptional, IsEnum, IsDateString, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { GOCASHLedgerDirection, GOCASHLedgerStatus, GOCASHTransactionType } from '@prisma/client';

export class SearchQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @ApiPropertyOptional({ description: 'Page number', default: 1 })
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @ApiPropertyOptional({ description: 'Items per page', default: 20 })
  limit?: number = 20;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ description: 'Search query' })
  search?: string;
}

export class LedgerQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @ApiPropertyOptional({ description: 'Page number', default: 1 })
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @ApiPropertyOptional({ description: 'Items per page', default: 50 })
  limit?: number = 50;

  @IsOptional()
  @IsEnum(GOCASHLedgerDirection)
  @ApiPropertyOptional({ description: 'Filter by direction', enum: GOCASHLedgerDirection })
  direction?: GOCASHLedgerDirection;

  @IsOptional()
  @IsEnum(GOCASHLedgerStatus)
  @ApiPropertyOptional({ description: 'Filter by status', enum: GOCASHLedgerStatus })
  status?: GOCASHLedgerStatus;

  @IsOptional()
  @IsEnum(GOCASHTransactionType)
  @ApiPropertyOptional({ description: 'Filter by transaction type', enum: GOCASHTransactionType })
  type?: GOCASHTransactionType;

  @IsOptional()
  @IsDateString()
  @ApiPropertyOptional({ description: 'Start date (ISO 8601)' })
  from?: string;

  @IsOptional()
  @IsDateString()
  @ApiPropertyOptional({ description: 'End date (ISO 8601)' })
  to?: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ description: 'Reference ID' })
  referenceId?: string;
}
