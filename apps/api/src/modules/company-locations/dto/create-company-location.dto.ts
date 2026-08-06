import { IsString, IsOptional, IsEnum, IsBoolean, IsNumber } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { LocationType } from '@prisma/client';

export class CreateCompanyLocationDto {
  @IsString()
  @ApiProperty({ description: 'Company ID' })
  companyId: string;

  @IsOptional()
  @IsEnum(LocationType)
  @ApiPropertyOptional({ description: 'Location type', enum: LocationType })
  type?: LocationType;

  @IsString()
  @ApiProperty({ description: 'Address line 1' })
  addressLine1: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ description: 'Address line 2' })
  addressLine2?: string;

  @IsString()
  @ApiProperty({ description: 'City' })
  city: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ description: 'District' })
  district?: string;

  @IsString()
  @ApiProperty({ description: 'State' })
  state: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ description: 'Country' })
  country?: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ description: 'Pincode' })
  pincode?: string;

  @IsOptional()
  @IsNumber()
  @ApiPropertyOptional({ description: 'Latitude' })
  latitude?: number;

  @IsOptional()
  @IsNumber()
  @ApiPropertyOptional({ description: 'Longitude' })
  longitude?: number;

  @IsOptional()
  @IsBoolean()
  @ApiPropertyOptional({ description: 'Whether this is the primary location' })
  isPrimary?: boolean;
}
