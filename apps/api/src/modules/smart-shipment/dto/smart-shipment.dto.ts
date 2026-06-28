import { IsString, IsOptional, IsEnum, IsArray, IsNumber, Min, ValidateNested, IsObject, IsDateString } from 'class-validator';
import { Type } from 'class-transformer';
import { ShipmentType } from '@prisma/client';

export class CreateShipmentPackageDto {
  @IsOptional() @IsString() label?: string;
  @IsOptional() @IsNumber() @Min(0) weight?: number;
  @IsOptional() @IsString() weightUnit?: string;
  @IsOptional() @IsNumber() @Min(0) length?: number;
  @IsOptional() @IsNumber() @Min(0) width?: number;
  @IsOptional() @IsNumber() @Min(0) height?: number;
  @IsOptional() @IsString() contents?: string;
  @IsOptional() @IsNumber() @Min(0) declaredValue?: number;
}

export class CreateShipmentDto {
  @IsString()
  orderId: string;

  @IsOptional()
  @IsString()
  purchaseOrderId?: string;

  @IsOptional()
  @IsEnum(ShipmentType)
  type?: ShipmentType;

  @IsOptional()
  @IsNumber()
  @Min(0)
  weight?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  totalPackages?: number;

  @IsOptional()
  @IsObject()
  deliveryAddress?: Record<string, unknown>;

  @IsOptional()
  @IsObject()
  pickupAddress?: Record<string, unknown>;

  @IsOptional()
  @IsString()
  specialInstructions?: string;

  @IsOptional()
  @IsString()
  buyerNotes?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateShipmentPackageDto)
  packages?: CreateShipmentPackageDto[];
}

export class AssignCourierDto {
  @IsString()
  courierProviderId: string;

  @IsString()
  trackingNumber: string;

  @IsOptional()
  @IsDateString()
  estimatedDeliveryDate?: string;

  @IsOptional()
  @IsObject()
  courierDetails?: Record<string, unknown>;
}

export class UpdateTrackingDto {
  @IsOptional()
  @IsString()
  trackingNumber?: string;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  @IsString()
  note?: string;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;
}

export class UpdateShipmentDto {
  @IsOptional()
  @IsNumber()
  @Min(0)
  weight?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  totalPackages?: number;

  @IsOptional()
  @IsDateString()
  estimatedDeliveryDate?: string;

  @IsOptional()
  @IsString()
  specialInstructions?: string;

  @IsOptional()
  @IsString()
  sellerNotes?: string;
}

export class AddDocumentDto {
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
