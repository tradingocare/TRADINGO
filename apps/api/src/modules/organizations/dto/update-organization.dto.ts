import { IsString, MinLength, IsOptional, IsEmail } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateOrganizationDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  @ApiPropertyOptional({ description: 'Organization name' })
  name?: string;

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
