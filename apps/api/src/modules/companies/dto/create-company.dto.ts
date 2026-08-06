import { IsString, MinLength, IsOptional, IsEmail, IsEnum, IsInt, Min, IsArray, Matches } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { BusinessType, GeographicReach, CompanyStatus } from '@prisma/client';

export class CreateCompanyDto {
  @IsString()
  @MinLength(2)
  @ApiProperty({ description: 'Company name' })
  name: string;

  @IsOptional()
  @IsString()
  @Matches(/^[a-z0-9-]+$/, { message: 'Slug must contain only lowercase letters, numbers, and hyphens' })
  @ApiPropertyOptional({ description: 'URL slug' })
  slug?: string;

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
  @IsString()
  @ApiPropertyOptional({ description: 'Organization ID' })
  organizationId?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @ApiPropertyOptional({ description: 'Category IDs' })
  categoryIds?: string[];
}
