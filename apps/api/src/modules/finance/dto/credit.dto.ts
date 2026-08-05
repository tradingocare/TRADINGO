import { IsString, IsOptional, IsNumber, IsEnum, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CreditStatus, RiskLevel } from '@prisma/client';

export class SetCreditLimitDto {
  @IsNumber() @Min(0) @Type(() => Number)
  @ApiProperty({ description: 'Credit limit amount' })
  creditLimit: number;
  @IsOptional() @IsString()
  @ApiPropertyOptional({ description: 'Additional notes' })
  notes?: string;
}

export class UpdateCreditStatusDto {
  @IsEnum(CreditStatus)
  @ApiProperty({ description: 'Credit status', enum: CreditStatus })
  status: CreditStatus;
  @IsOptional() @IsString()
  @ApiPropertyOptional({ description: 'Status change reason' })
  reason?: string;
}

export class UpdateRiskLevelDto {
  @IsEnum(RiskLevel)
  @ApiProperty({ description: 'Risk level', enum: RiskLevel })
  riskLevel: RiskLevel;
  @IsOptional() @IsString()
  @ApiPropertyOptional({ description: 'Risk level change reason' })
  reason?: string;
}

export class RequestCreditApprovalDto {
  @IsEnum(['LIMIT_INCREASE', 'CREDIT_EXTENSION', 'SUSPENSION_OVERRIDE'])
  @ApiProperty({ description: 'Approval request type' })
  requestType: string;
  @IsOptional() @IsNumber() @Min(0) @Type(() => Number)
  @ApiPropertyOptional({ description: 'Requested credit limit' })
  requestedLimit?: number;
  @IsString()
  @ApiProperty({ description: 'Request reason' })
  reason: string;
}

export class ApproveCreditApprovalDto {
  @IsOptional() @IsString()
  @ApiPropertyOptional({ description: 'Approval notes' })
  notes?: string;
}

export class RejectCreditApprovalDto {
  @IsString()
  @ApiProperty({ description: 'Rejection reason' })
  reason: string;
}

export class QueryCreditDto {
  @IsOptional() @IsString()
  @ApiPropertyOptional({ description: 'Search query' })
  search?: string;
  @IsOptional() @IsEnum(CreditStatus)
  @ApiPropertyOptional({ description: 'Filter by credit status', enum: CreditStatus })
  status?: CreditStatus;
  @IsOptional() @IsEnum(RiskLevel)
  @ApiPropertyOptional({ description: 'Filter by risk level', enum: RiskLevel })
  riskLevel?: RiskLevel;
  @IsOptional() @IsNumber() @Type(() => Number)
  @ApiPropertyOptional({ description: 'Page number' })
  page?: number;
  @IsOptional() @IsNumber() @Type(() => Number)
  @ApiPropertyOptional({ description: 'Items per page' })
  limit?: number;
}
