import { IsString, MinLength, IsOptional, IsEmail, Matches } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateOrganizationDto {
  @IsString()
  @MinLength(2)
  @ApiProperty({ description: 'Organization name' })
  name: string;

  @IsOptional()
  @IsString()
  @Matches(/^[a-z0-9-]+$/, { message: 'Slug must contain only lowercase letters, numbers, and hyphens' })
  @ApiPropertyOptional({ description: 'URL slug' })
  slug?: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ description: 'Organization description' })
  description?: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ description: 'Organization logo URL' })
  logo?: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ description: 'Website URL' })
  website?: string;

  @IsOptional()
  @IsEmail()
  @ApiPropertyOptional({ description: 'Organization email' })
  email?: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ description: 'Phone number' })
  phone?: string;
}
