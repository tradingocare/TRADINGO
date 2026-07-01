import { IsString, IsOptional, IsNumber, IsEnum, IsDateString, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { CreditStatus, RiskLevel, CreditApprovalStatus } from '@prisma/client';

export class SetCreditLimitDto {
  @IsNumber() @Min(0) @Type(() => Number) creditLimit: number;
  @IsOptional() @IsString() notes?: string;
}

export class UpdateCreditStatusDto {
  @IsEnum(CreditStatus) status: CreditStatus;
  @IsOptional() @IsString() reason?: string;
}

export class UpdateRiskLevelDto {
  @IsEnum(RiskLevel) riskLevel: RiskLevel;
  @IsOptional() @IsString() reason?: string;
}

export class RequestCreditApprovalDto {
  @IsEnum(['LIMIT_INCREASE', 'CREDIT_EXTENSION', 'SUSPENSION_OVERRIDE']) requestType: string;
  @IsOptional() @IsNumber() @Min(0) @Type(() => Number) requestedLimit?: number;
  @IsString() reason: string;
}

export class ApproveCreditApprovalDto {
  @IsOptional() @IsString() notes?: string;
}

export class RejectCreditApprovalDto {
  @IsString() reason: string;
}

export class QueryCreditDto {
  @IsOptional() @IsString() search?: string;
  @IsOptional() @IsEnum(CreditStatus) status?: CreditStatus;
  @IsOptional() @IsEnum(RiskLevel) riskLevel?: RiskLevel;
  @IsOptional() @IsNumber() @Type(() => Number) page?: number;
  @IsOptional() @IsNumber() @Type(() => Number) limit?: number;
}
