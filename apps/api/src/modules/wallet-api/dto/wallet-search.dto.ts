import { IsOptional, IsString, IsEnum, IsNumber, Min, IsDateString, IsUUID } from 'class-validator';
import { Type } from 'class-transformer';
import { GOCASHWalletStatus, GOCASHLedgerDirection, GOCASHLedgerStatus, GOCASHTransactionType } from '@prisma/client';

export class WalletSearchDto {
  @IsOptional() @IsString() search?: string;
  @IsOptional() @IsEnum(GOCASHWalletStatus) status?: GOCASHWalletStatus;
  @IsOptional() @IsUUID() userId?: string;
  @IsOptional() @IsUUID() companyId?: string;
  @IsOptional() @IsNumber() @Min(1) @Type(() => Number) page?: number;
  @IsOptional() @IsNumber() @Min(1) @Type(() => Number) limit?: number;
}

export class LedgerSearchDto {
  @IsOptional() @IsString() search?: string;
  @IsOptional() @IsEnum(GOCASHLedgerDirection) direction?: GOCASHLedgerDirection;
  @IsOptional() @IsEnum(GOCASHLedgerStatus) status?: GOCASHLedgerStatus;
  @IsOptional() @IsEnum(GOCASHTransactionType) type?: GOCASHTransactionType;
  @IsOptional() @IsString() referenceId?: string;
  @IsOptional() @IsString() referenceType?: string;
  @IsOptional() @IsString() sourceSystem?: string;
  @IsOptional() @IsDateString() from?: string;
  @IsOptional() @IsDateString() to?: string;
  @IsOptional() @IsUUID() walletId?: string;
  @IsOptional() @IsUUID() userId?: string;
  @IsOptional() @IsNumber() @Min(1) @Type(() => Number) page?: number;
  @IsOptional() @IsNumber() @Min(1) @Type(() => Number) limit?: number;
}

export class StatementQueryDto {
  @IsOptional() @IsDateString() from?: string;
  @IsOptional() @IsDateString() to?: string;
  @IsOptional() @IsString() period?: 'monthly' | 'quarterly' | 'yearly';
  @IsOptional() @IsUUID() walletId?: string;
  @IsOptional() @IsString() format?: 'json' | 'csv';
}

export class ManualCreditDto {
  @IsUUID() walletId: string;
  @IsNumber() @Min(0.01) @Type(() => Number) amount: number;
  @IsString() reason: string;
  @IsOptional() @IsString() referenceId?: string;
  @IsOptional() @IsString() referenceType?: string;
  @IsOptional() @IsString() notes?: string;
}

export class ManualDebitDto {
  @IsUUID() walletId: string;
  @IsNumber() @Min(0.01) @Type(() => Number) amount: number;
  @IsString() reason: string;
  @IsOptional() @IsString() referenceId?: string;
  @IsOptional() @IsString() referenceType?: string;
  @IsOptional() @IsString() notes?: string;
}

export class AdjustWalletDto {
  @IsUUID() walletId: string;
  @IsNumber() @Type(() => Number) amount: number;
  @IsString() reason: string;
  @IsOptional() @IsString() notes?: string;
}

export class ReverseTransactionDto {
  @IsUUID() transactionId: string;
  @IsString() reason: string;
  @IsOptional() @IsString() notes?: string;
}
