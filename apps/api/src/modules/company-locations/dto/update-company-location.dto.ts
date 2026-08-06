import { IsString, IsOptional, IsEnum, IsBoolean, IsNumber } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { LocationType } from '@prisma/client';

export class UpdateCompanyLocationDto {
  @IsOptional()
  @IsEnum(LocationType)
  @ApiPropertyOptional({ description: 'Location type', enum: LocationType })
  type?: LocationType;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ description: 'Address line 1' })
  addressLine1?: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ description: 'Address line 2' })
  addressLine2?: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ description: 'City' })
  city?: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ description: 'District' })
  district?: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ description: 'State' })
  state?: string;

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
