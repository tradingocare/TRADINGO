import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsInt, IsOptional, IsString, IsUUID, Min } from 'class-validator';

export enum PaymentOrderType {
  ORDER = 'ORDER_PAYMENT',
  CREDIT_PACK = 'CREDIT_PACK_PURCHASE',
  SUBSCRIPTION = 'SUBSCRIPTION',
}

export class CreatePaymentOrderDto {
  @IsEnum(PaymentOrderType)
  type: PaymentOrderType;

  // P0-5 remediation — money unit contract (mirrors CreateBookingPaymentOrderDto):
  // `amount` is INTEGER PAISE (e.g. 50000 = ₹500), matching the canonical
  // Payment.amount minor-unit convention.
  // R3 authority rule: for ORDER_PAYMENT the gateway amount comes exclusively
  // from the persisted Order.totalAmount — `amount` is accepted syntactically
  // (contract compatibility) but never determines the gateway charge.
  // Other payment types pass the value to the gateway as before.
  @ApiProperty({ description: 'Amount in paise (e.g. 50000 = ₹500)' })
  @IsInt()
  @Min(1)
  amount: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  currency?: string;

  @IsOptional()
  @IsUUID()
  orderId?: string;

  @IsOptional()
  @IsUUID()
  rfqCreditPackId?: string;

  @IsOptional()
  @IsString()
  description?: string;
}
