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
}
