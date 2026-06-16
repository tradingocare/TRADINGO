import { IsOptional, IsString, IsEnum, IsInt, Min, IsDateString } from 'class-validator';
import { EscrowStatus } from '@prisma/client';

export class QueryEscrowDto {
  @IsOptional() @IsEnum(EscrowStatus) status?: EscrowStatus;
  @IsOptional() @IsInt() @Min(0) skip?: number;
  @IsOptional() @IsInt() @Min(1) take?: number;
  @IsOptional() @IsDateString() startDate?: string;
  @IsOptional() @IsDateString() endDate?: string;
}

export class FreezeEscrowDto {
  @IsOptional() @IsString() reason?: string;
}

export class RefundEscrowDto {
  @IsOptional() @IsString() reason?: string;
}
