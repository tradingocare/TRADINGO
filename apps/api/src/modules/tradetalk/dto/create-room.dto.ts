import { IsString, IsOptional, IsNumber } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class CreateRoomDto {
  @IsString()
  @ApiProperty({ description: 'Room name' })
  name: string;
  @IsString()
  @ApiProperty({ description: 'URL slug' })
  slug: string;
  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ description: 'Room description' })
  description?: string;
  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ description: 'Room icon' })
  icon?: string;
  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ description: 'Industry ID' })
  industryId?: string;
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @ApiPropertyOptional({ description: 'Sort order' })
  sortOrder?: number;
}
