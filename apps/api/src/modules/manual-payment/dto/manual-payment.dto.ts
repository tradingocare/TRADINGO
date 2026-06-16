import { IsOptional, IsString, IsEnum, IsInt, Min, IsUUID, IsDateString } from 'class-validator';
import { ManualPaymentMethod, ManualPaymentVerificationStatus } from '@prisma/client';

export class CreateManualPaymentProofDto {
  @IsUUID() paymentId: string;
  @IsOptional() @IsString() utrNumber?: string;
  @IsOptional() @IsString() transactionScreenshot?: string;
  @IsOptional() @IsDateString() transactionDate?: string;
  @IsOptional() @IsString() bankName?: string;
  @IsEnum(ManualPaymentMethod) paymentMethod: ManualPaymentMethod;
  @IsInt() @Min(1) amount: number;
}

export class VerifyManualPaymentProofDto {
  @IsOptional() @IsString() remarks?: string;
}

export class RejectManualPaymentProofDto {
  @IsString() reason: string;
}

export class QueryManualPaymentProofDto {
  @IsOptional() @IsEnum(ManualPaymentVerificationStatus) verificationStatus?: ManualPaymentVerificationStatus;
  @IsOptional() @IsInt() @Min(0) skip?: number;
  @IsOptional() @IsInt() @Min(1) take?: number;
}
