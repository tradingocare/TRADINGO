import { IsString, IsOptional, IsNumber, IsIn, Min } from 'class-validator';

export class ProcessBookingRefundDto {
  @IsString()
  bookingId!: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  amount?: number;

  @IsOptional()
  @IsString()
  reason?: string;

  @IsOptional()
  @IsString()
  @IsIn(['FULL', 'PARTIAL', 'CANCELLATION'])
  refundType?: string;
}

export class ProcessManualRefundDto {
  @IsString()
  bookingId!: string;

  @IsNumber()
  @Min(1)
  amount!: number;

  @IsString()
  reason!: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class BookingRefundResult {
  success: boolean;
  refundId: string | null;
  bookingId: string;
  amount: number;
  refundType: string;
  paymentStatus: string;
  escrowStatus: string;
  bookingStatus: string;
}

export class ManualRefundApprovalDto {
  @IsString()
  refundId!: string;

  @IsString()
  @IsIn(['APPROVED', 'REJECTED'])
  decision!: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
