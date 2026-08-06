import { IsOptional, IsString, IsEnum, IsNumber, Min, IsDateString, IsUUID } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { GOCASHWalletStatus, GOCASHLedgerDirection, GOCASHLedgerStatus, GOCASHTransactionType } from '@prisma/client';

export class WalletSearchDto {
  @IsOptional() @IsString()
  @ApiPropertyOptional({ description: 'Search query' })
  search?: string;
  @IsOptional() @IsEnum(GOCASHWalletStatus)
  @ApiPropertyOptional({ description: 'Filter by wallet status', enum: GOCASHWalletStatus })
  status?: GOCASHWalletStatus;
  @IsOptional() @IsUUID()
  @ApiPropertyOptional({ description: 'User ID' })
  userId?: string;
  @IsOptional() @IsUUID()
  @ApiPropertyOptional({ description: 'Company ID' })
  companyId?: string;
  @IsOptional() @IsNumber() @Min(1) @Type(() => Number)
  @ApiPropertyOptional({ description: 'Page number' })
  page?: number;
  @IsOptional() @IsNumber() @Min(1) @Type(() => Number)
  @ApiPropertyOptional({ description: 'Items per page' })
  limit?: number;
}

export class LedgerSearchDto {
  @IsOptional() @IsString()
  @ApiPropertyOptional({ description: 'Search query' })
  search?: string;
  @IsOptional() @IsEnum(GOCASHLedgerDirection)
  @ApiPropertyOptional({ description: 'Filter by direction', enum: GOCASHLedgerDirection })
  direction?: GOCASHLedgerDirection;
  @IsOptional() @IsEnum(GOCASHLedgerStatus)
  @ApiPropertyOptional({ description: 'Filter by status', enum: GOCASHLedgerStatus })
  status?: GOCASHLedgerStatus;
  @IsOptional() @IsEnum(GOCASHTransactionType)
  @ApiPropertyOptional({ description: 'Filter by transaction type', enum: GOCASHTransactionType })
  type?: GOCASHTransactionType;
  @IsOptional() @IsString()
  @ApiPropertyOptional({ description: 'Reference ID' })
  referenceId?: string;
  @IsOptional() @IsString()
  @ApiPropertyOptional({ description: 'Reference type' })
  referenceType?: string;
  @IsOptional() @IsString()
  @ApiPropertyOptional({ description: 'Source system' })
  sourceSystem?: string;
  @IsOptional() @IsDateString()
  @ApiPropertyOptional({ description: 'Start date (ISO 8601)' })
  from?: string;
  @IsOptional() @IsDateString()
  @ApiPropertyOptional({ description: 'End date (ISO 8601)' })
  to?: string;
  @IsOptional() @IsUUID()
  @ApiPropertyOptional({ description: 'Wallet ID' })
  walletId?: string;
  @IsOptional() @IsUUID()
  @ApiPropertyOptional({ description: 'User ID' })
  userId?: string;
  @IsOptional() @IsNumber() @Min(1) @Type(() => Number)
  @ApiPropertyOptional({ description: 'Page number' })
  page?: number;
  @IsOptional() @IsNumber() @Min(1) @Type(() => Number)
  @ApiPropertyOptional({ description: 'Items per page' })
  limit?: number;
}

export class StatementQueryDto {
  @IsOptional() @IsDateString()
  @ApiPropertyOptional({ description: 'Start date (ISO 8601)' })
  from?: string;
  @IsOptional() @IsDateString()
  @ApiPropertyOptional({ description: 'End date (ISO 8601)' })
  to?: string;
  @IsOptional() @IsString()
  @ApiPropertyOptional({ description: 'Statement period' })
  period?: 'monthly' | 'quarterly' | 'yearly';
  @IsOptional() @IsUUID()
  @ApiPropertyOptional({ description: 'Wallet ID' })
  walletId?: string;
  @IsOptional() @IsString()
  @ApiPropertyOptional({ description: 'Output format (json or csv)' })
  format?: 'json' | 'csv';
}

export class ManualCreditDto {
  @IsUUID()
  @ApiProperty({ description: 'Wallet ID' })
  walletId: string;
  @IsNumber() @Min(0.01) @Type(() => Number)
  @ApiProperty({ description: 'Credit amount' })
  amount: number;
  @IsString()
  @ApiProperty({ description: 'Reason for credit' })
  reason: string;
  @IsOptional() @IsString()
  @ApiPropertyOptional({ description: 'Reference ID' })
  referenceId?: string;
  @IsOptional() @IsString()
  @ApiPropertyOptional({ description: 'Reference type' })
  referenceType?: string;
  @IsOptional() @IsString()
  @ApiPropertyOptional({ description: 'Additional notes' })
  notes?: string;
}

export class ManualDebitDto {
  @IsUUID()
  @ApiProperty({ description: 'Wallet ID' })
  walletId: string;
  @IsNumber() @Min(0.01) @Type(() => Number)
  @ApiProperty({ description: 'Debit amount' })
  amount: number;
  @IsString()
  @ApiProperty({ description: 'Reason for debit' })
  reason: string;
  @IsOptional() @IsString()
  @ApiPropertyOptional({ description: 'Reference ID' })
  referenceId?: string;
  @IsOptional() @IsString()
  @ApiPropertyOptional({ description: 'Reference type' })
  referenceType?: string;
  @IsOptional() @IsString()
  @ApiPropertyOptional({ description: 'Additional notes' })
  notes?: string;
}

export class AdjustWalletDto {
  @IsUUID()
  @ApiProperty({ description: 'Wallet ID' })
  walletId: string;
  @IsNumber() @Type(() => Number)
  @ApiProperty({ description: 'Adjustment amount (positive or negative)' })
  amount: number;
  @IsString()
  @ApiProperty({ description: 'Reason for adjustment' })
  reason: string;
  @IsOptional() @IsString()
  @ApiPropertyOptional({ description: 'Additional notes' })
  notes?: string;
}

export class ReverseTransactionDto {
  @IsUUID()
  @ApiProperty({ description: 'Transaction ID to reverse' })
  transactionId: string;
  @IsString()
  @ApiProperty({ description: 'Reason for reversal' })
  reason: string;
  @IsOptional() @IsString()
  @ApiPropertyOptional({ description: 'Additional notes' })
  notes?: string;
}
