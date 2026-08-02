import { IsString, IsOptional, IsInt, IsObject } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateBadgeDto {
  @IsString()
  @ApiProperty({ description: 'Badge name' })
  name!: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ description: 'Badge description' })
  description?: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ description: 'Badge icon' })
  icon?: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ description: 'Badge color' })
  color?: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ description: 'Badge category' })
  category?: string;

  @IsOptional()
  @IsObject()
  @ApiPropertyOptional({ description: 'Badge criteria' })
  criteria?: any;

  @IsOptional()
  @IsObject()
  @ApiPropertyOptional({ description: 'Badge rewards' })
  rewards?: any;

  @IsOptional()
  @IsInt()
  @ApiPropertyOptional({ description: 'Sort order' })
  sortOrder?: number;
}
