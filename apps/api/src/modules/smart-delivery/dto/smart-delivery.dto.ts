import { IsString, IsOptional, IsEnum, IsBoolean, IsNumber, Min } from 'class-validator';

export class CreateDeliveryDto {
  @IsString()
  shipmentId: string;

  @IsOptional()
  @IsString()
  receiverName?: string;

  @IsOptional()
  @IsString()
  receiverMobile?: string;

  @IsOptional()
  @IsString()
  courierNotes?: string;

  @IsOptional()
  @IsString()
  buyerNotes?: string;
}

export class ConfirmDeliveryDto {
  @IsOptional()
  @IsString()
  receiverName?: string;

  @IsOptional()
  @IsString()
  receiverMobile?: string;

  @IsOptional()
  @IsBoolean()
  otpVerified?: boolean;

  @IsOptional()
  @IsString()
  digitalSignatureUrl?: string;

  @IsOptional()
  @IsString()
  photoUrls?: string;

  @IsOptional()
  @IsNumber()
  @Min(-90)
  geoLatitude?: number;

  @IsOptional()
  @IsNumber()
  @Min(-180)
  geoLongitude?: number;

  @IsOptional()
  @IsString()
  courierNotes?: string;

  @IsOptional()
  @IsString()
  buyerNotes?: string;
}

export class RejectDeliveryDto {
  @IsString()
  reason: string;

  @IsOptional()
  @IsString()
  note?: string;
}

export class UpdateDeliveryStatusDto {
  @IsString()
  status: string;

  @IsOptional()
  @IsString()
  note?: string;
}

export class AddDeliveryDocumentDto {
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
