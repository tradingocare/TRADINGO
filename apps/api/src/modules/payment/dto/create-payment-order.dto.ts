import { IsEnum, IsInt, IsOptional, IsString, IsUUID, Min } from 'class-validator';

export enum PaymentOrderType {
  ORDER = 'ORDER_PAYMENT',
  CREDIT_PACK = 'CREDIT_PACK_PURCHASE',
}

export class CreatePaymentOrderDto {
  @IsEnum(PaymentOrderType)
  type: PaymentOrderType;

  @IsInt()
  @Min(1)
  amount: number;

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
