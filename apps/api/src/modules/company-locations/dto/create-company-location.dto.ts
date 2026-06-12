import { IsString, IsOptional, IsEnum, IsBoolean, IsNumber } from 'class-validator';
import { LocationType } from '@prisma/client';

export class CreateCompanyLocationDto {
  @IsString()
  companyId: string;

  @IsOptional()
  @IsEnum(LocationType)
  type?: LocationType;

  @IsString()
  addressLine1: string;

  @IsOptional()
  @IsString()
  addressLine2?: string;

  @IsString()
  city: string;

  @IsOptional()
  @IsString()
  district?: string;

  @IsString()
  state: string;

  @IsOptional()
  @IsString()
  country?: string;

  @IsOptional()
  @IsString()
  pincode?: string;

  @IsOptional()
  @IsNumber()
  latitude?: number;

  @IsOptional()
  @IsNumber()
  longitude?: number;

  @IsOptional()
  @IsBoolean()
  isPrimary?: boolean;
}
