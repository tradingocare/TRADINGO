import { IsString, IsOptional, IsNumber, IsArray } from 'class-validator';

export class UpdateSellerProfileDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  tagline?: string;

  @IsOptional()
  @IsString()
  businessType?: string;

  @IsOptional()
  @IsNumber()
  establishedYear?: number;

  @IsOptional()
  @IsNumber()
  employeeCount?: number;

  @IsOptional()
  @IsString()
  website?: string;

  @IsOptional()
  @IsString()
  logo?: string;

  @IsOptional()
  @IsString()
  banner?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  categories?: string[];

  @IsOptional()
  @IsString()
  instagramUrl?: string;

  @IsOptional()
  @IsString()
  linkedinUrl?: string;

  @IsOptional()
  @IsString()
  youtubeUrl?: string;

  @IsOptional()
  @IsString()
  facebookUrl?: string;

  @IsOptional()
  @IsString()
  twitterUrl?: string;

  @IsOptional()
  @IsString()
  whatsappUrl?: string;

  @IsOptional()
  @IsString()
  indiamartUrl?: string;

  @IsOptional()
  @IsString()
  tradeindiaUrl?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  productImages?: string[];

  @IsOptional()
  @IsString()
  catalogPdfUrl?: string;
}

export class UpdateSellerDocumentsDto {
  @IsOptional()
  @IsString()
  aadhar?: string;

  @IsOptional()
  @IsString()
  pan?: string;

  @IsOptional()
  @IsString()
  gst?: string;

  @IsOptional()
  @IsString()
  businessRegistration?: string;

  @IsOptional()
  @IsString()
  addressProof?: string;

  @IsOptional()
  @IsString()
  gstCertUrl?: string;

  @IsOptional()
  @IsString()
  panCardUrl?: string;

  @IsOptional()
  @IsString()
  bankDocUrl?: string;

  @IsOptional()
  @IsString()
  tradeLicenseUrl?: string;

  @IsOptional()
  @IsString()
  msmeUrl?: string;

  @IsOptional()
  @IsString()
  incorporationUrl?: string;

  @IsOptional()
  @IsString()
  iso9001Url?: string;

  @IsOptional()
  @IsString()
  iso14001Url?: string;

  @IsOptional()
  @IsString()
  bisUrl?: string;

  @IsOptional()
  @IsString()
  fssaiUrl?: string;

  @IsOptional()
  @IsString()
  drugLicenseUrl?: string;

  @IsOptional()
  @IsString()
  iecUrl?: string;
}
