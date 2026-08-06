import { IsString, MinLength, IsOptional, IsEmail, IsEnum, IsInt, Min, IsArray } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { BusinessType, GeographicReach, CompanyStatus } from '@prisma/client';

export class UpdateCompanyDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  @ApiPropertyOptional({ description: 'Company name' })
  name?: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ description: 'Company logo URL' })
  logo?: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ description: 'Company banner URL' })
  banner?: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ description: 'Company description' })
  description?: string;

  @IsOptional()
  @IsEnum(BusinessType)
  @ApiPropertyOptional({ description: 'Business type', enum: BusinessType })
  businessType?: BusinessType;

  @IsOptional()
  @IsInt()
  @Min(1800)
  @ApiPropertyOptional({ description: 'Established year' })
  establishedYear?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @ApiPropertyOptional({ description: 'Number of employees' })
  employeeCount?: number;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ description: 'GST number' })
  gstNumber?: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ description: 'PAN number' })
  panNumber?: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ description: 'Website URL' })
  website?: string;

  @IsOptional()
  @IsEmail()
  @ApiPropertyOptional({ description: 'Company email' })
  email?: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ description: 'Mobile number' })
  mobile?: string;

  @IsOptional()
  @IsEnum(GeographicReach)
  @ApiPropertyOptional({ description: 'Geographic reach', enum: GeographicReach })
  geographicReach?: GeographicReach;

  @IsOptional()
  @IsEnum(CompanyStatus)
  @ApiPropertyOptional({ description: 'Company status', enum: CompanyStatus })
  status?: CompanyStatus;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @ApiPropertyOptional({ description: 'Category IDs' })
  categoryIds?: string[];
}
