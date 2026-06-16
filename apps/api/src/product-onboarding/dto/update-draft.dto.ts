import { IsOptional, IsString, IsNumber, IsBoolean, IsEnum, IsArray, ValidateNested, Min, Max, IsUUID, IsInt } from 'class-validator';
import { Type } from 'class-transformer';
import { MediaType, VariantType, GeographicReach } from '@prisma/client';

class DraftSpecDto {
  @IsString() key: string;
  @IsString() value: string;
  @IsOptional() @IsNumber() sortOrder?: number;
}

class DraftVariantDto {
  @IsEnum(VariantType) variantType: VariantType;
  @IsOptional() @IsString() customName?: string;
  @IsString() value: string;
  @IsOptional() @IsString() sku?: string;
  @IsOptional() @IsNumber() price?: number;
  @IsOptional() @IsNumber() compareAtPrice?: number;
  @IsOptional() @IsString() currency?: string;
  @IsOptional() @IsInt() quantity?: number;
  @IsOptional() @IsNumber() sortOrder?: number;
}

class DraftMediaDto {
  @IsEnum(MediaType) type: MediaType;
  @IsString() url: string;
  @IsOptional() @IsString() title?: string;
  @IsOptional() @IsString() altText?: string;
  @IsOptional() @IsBoolean() isPrimary?: boolean;
  @IsOptional() @IsNumber() sortOrder?: number;
}

class DraftAttachmentDto {
  @IsString() type: string;
  @IsString() url: string;
  @IsOptional() @IsString() title?: string;
  @IsOptional() @IsNumber() sortOrder?: number;
}

class DraftCertificationDto {
  @IsString() type: string;
  @IsOptional() @IsString() number?: string;
  @IsOptional() @IsString() issuedBy?: string;
  @IsOptional() @IsString() issuedAt?: string;
  @IsOptional() @IsString() expiresAt?: string;
  @IsOptional() @IsString() fileUrl?: string;
}

class DraftMultiLangDescDto {
  @IsString() locale: string;
  @IsOptional() @IsString() name?: string;
  @IsOptional() @IsString() shortDescription?: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsBoolean() isPrimary?: boolean;
}

class DraftPriceSlabDto {
  @IsNumber() @Min(1) minQty: number;
  @IsOptional() @IsNumber() @Min(1) maxQty?: number;
  @IsNumber() price: number;
  @IsOptional() @IsString() currency?: string;
}

export class UpdateDraftDto {
  @IsOptional() @IsUUID() categoryId?: string;
  @IsOptional() @IsUUID() subcategoryId?: string;
  @IsOptional() @IsString() name?: string;
  @IsOptional() @IsString() shortDescription?: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsString() productType?: string;
  @IsOptional() @IsString() brand?: string;
  @IsOptional() @IsString() model?: string;
  @IsOptional() @IsString() sku?: string;
  @IsOptional() @IsString() gtin?: string;
  @IsOptional() @IsString() hsCode?: string;
  @IsOptional() @IsNumber() @Min(1) moq?: number;
  @IsOptional() @IsString() unit?: string;
  @IsOptional() @IsEnum(GeographicReach) visibilityRadius?: GeographicReach;
  @IsOptional() @IsNumber() @Min(-90) @Max(90) latitude?: number;
  @IsOptional() @IsNumber() @Min(-180) @Max(180) longitude?: number;
  @IsOptional() @IsBoolean() isSampleOrder?: boolean;
  @IsOptional() @IsNumber() samplePrice?: number;
  @IsOptional() @IsBoolean() exportSupported?: boolean;
  @IsOptional() @IsArray() @IsString({ each: true }) exportCountries?: string[];

  @IsOptional() @IsArray() @ValidateNested({ each: true }) @Type(() => DraftSpecDto) specs?: DraftSpecDto[];
  @IsOptional() @IsArray() @ValidateNested({ each: true }) @Type(() => DraftVariantDto) variants?: DraftVariantDto[];
  @IsOptional() @IsArray() @ValidateNested({ each: true }) @Type(() => DraftMediaDto) media?: DraftMediaDto[];
  @IsOptional() @IsArray() @ValidateNested({ each: true }) @Type(() => DraftAttachmentDto) attachments?: DraftAttachmentDto[];
  @IsOptional() @IsArray() @ValidateNested({ each: true }) @Type(() => DraftCertificationDto) certifications?: DraftCertificationDto[];
  @IsOptional() @IsArray() @ValidateNested({ each: true }) @Type(() => DraftMultiLangDescDto) multiLangDescriptions?: DraftMultiLangDescDto[];
  @IsOptional() @IsArray() @ValidateNested({ each: true }) @Type(() => DraftPriceSlabDto) priceSlabs?: DraftPriceSlabDto[];
}
