import { IsOptional, IsString, IsEnum, IsInt, Min, IsUUID, IsDateString } from 'class-validator';
import { DisputeType, DisputeReason, DisputeStatus, ResolutionType } from '@prisma/client';

export class CreateDisputeDto {
  @IsUUID() orderId: string;
  @IsEnum(DisputeType) type: DisputeType;
  @IsEnum(DisputeReason) reason: DisputeReason;
  @IsString() description: string;
  @IsOptional() @IsInt() @Min(1) amount?: number;
}

export class UpdateDisputeStatusDto {
  @IsEnum(DisputeStatus) status: DisputeStatus;
  @IsOptional() @IsString() description?: string;
}

export class AddMessageDto {
  @IsString() content: string;
}

export class AddEvidenceDto {
  @IsString() fileName: string;
  @IsString() fileUrl: string;
  @IsOptional() @IsString() mimeType?: string;
  @IsOptional() @IsInt() @Min(0) fileSize?: number;
}

export class ResolveDisputeDto {
  @IsEnum(ResolutionType) resolutionType: ResolutionType;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsInt() @Min(0) refundAmount?: number;
  @IsOptional() @IsString() replacementInfo?: string;
  @IsOptional() @IsInt() priceAdjustment?: number;
  @IsOptional() @IsString() notes?: string;
}

export class AppealDisputeDto {
  @IsString() reason: string;
  @IsOptional() @IsString() supportingInfo?: string;
}

export class ReviewAppealDto {
  @IsString() decision: string;
  @IsOptional() @IsString() decisionNotes?: string;
  @IsOptional() @IsString() status?: string;
}

export class QueryDisputeDto {
  @IsOptional() @IsEnum(DisputeStatus) status?: DisputeStatus;
  @IsOptional() @IsEnum(DisputeType) type?: DisputeType;
  @IsOptional() @IsInt() @Min(0) skip?: number;
  @IsOptional() @IsInt() @Min(1) take?: number;
  @IsOptional() @IsDateString() startDate?: string;
  @IsOptional() @IsDateString() endDate?: string;
}

export class EscalateDisputeDto {
  @IsOptional() @IsString() reason?: string;
}
