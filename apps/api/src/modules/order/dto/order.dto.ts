import { IsString, IsOptional, IsEnum, IsArray, IsNumber, Min, ValidateNested, IsBoolean, IsDateString } from 'class-validator';
import { Type } from 'class-transformer';
import { OrderSource, OrderType, DeliveryMethod, CancellationReason, CancellationActor, ReturnReason } from '@prisma/client';

export class CreateOrderItemDto {
  @IsOptional()
  @IsString()
  productId?: string;

  @IsString()
  productName: string;

  @IsOptional()
  @IsString()
  sku?: string;

  @IsNumber()
  @Min(1)
  quantity: number;

  @IsNumber()
  @Min(0)
  unitPrice: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  taxPercent?: number;
}

export class CreateOrderLocationDto {
  @IsString()
  type: string;

  @IsString()
  address: string;

  @IsString()
  city: string;

  @IsString()
  state: string;

  @IsOptional()
  @IsString()
  country?: string;

  @IsOptional()
  @IsString()
  pincode?: string;

  @IsOptional()
  @IsString()
  contactName?: string;

  @IsOptional()
  @IsString()
  contactPhone?: string;

  @IsOptional()
  @IsBoolean()
  isDeliveryLocation?: boolean;
}

export class CreateOrderDto {
  @IsOptional()
  @IsString()
  idempotencyKey?: string;

  @IsEnum(OrderSource)
  source: OrderSource;

  @IsEnum(OrderType)
  type: OrderType;

  @IsString()
  sellerCompanyId: string;

  @IsOptional()
  @IsString()
  rfqId?: string;

  @IsOptional()
  @IsString()
  quoteId?: string;

  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  currency?: string;

  @IsNumber()
  @Min(0)
  subtotal: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  taxAmount?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  discountAmount?: number;

  @IsNumber()
  @Min(0)
  totalAmount: number;

  @IsNumber()
  @Min(1)
  quantity: number;

  @IsOptional()
  @IsString()
  unit?: string;

  @IsOptional()
  @IsEnum(DeliveryMethod)
  deliveryMethod?: DeliveryMethod;

  @IsOptional()
  @IsString()
  buyerNotes?: string;

  @IsOptional()
  @IsDateString()
  expectedDeliveryDate?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateOrderItemDto)
  items: CreateOrderItemDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateOrderLocationDto)
  locations?: CreateOrderLocationDto[];
}

export class UpdateOrderDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsEnum(DeliveryMethod)
  deliveryMethod?: DeliveryMethod;

  @IsOptional()
  @IsString()
  trackingNumber?: string;

  @IsOptional()
  @IsString()
  transporterName?: string;

  @IsOptional()
  @IsString()
  vehicleNumber?: string;

  @IsOptional()
  @IsString()
  lrNumber?: string;

  @IsOptional()
  @IsString()
  ewayBillNumber?: string;

  @IsOptional()
  @IsDateString()
  expectedDeliveryDate?: string;

  @IsOptional()
  @IsString()
  sellerNotes?: string;
}

export class CancelOrderDto {
  @IsEnum(CancellationReason)
  reason: CancellationReason;

  @IsOptional()
  @IsString()
  reasonText?: string;

  @IsOptional()
  @IsEnum(CancellationActor)
  actor?: CancellationActor;

  @IsOptional()
  @IsString()
  note?: string;
}

export class CreateReturnDto {
  @IsOptional()
  @IsString()
  itemId?: string;

  @IsEnum(ReturnReason)
  reason: ReturnReason;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  quantity?: number;
}

export class ReviewReturnDto {
  @IsEnum(['APPROVED', 'REJECTED'])
  status: 'APPROVED' | 'REJECTED';

  @IsOptional()
  @IsString()
  adminNote?: string;
}

export class CreateOrderDocumentDto {
  @IsString()
  docType: string;

  @IsString()
  fileName: string;

  @IsString()
  fileUrl: string;

  @IsOptional()
  @IsString()
  mimeType?: string;

  @IsOptional()
  @IsNumber()
  fileSize?: number;
}
