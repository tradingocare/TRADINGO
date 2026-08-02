import { IsString, IsOptional, IsNumber, IsBoolean } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class UpdateRoomDto {
  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ description: 'Room name' })
  name?: string;
  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ description: 'URL slug' })
  slug?: string;
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
  @IsOptional()
  @IsBoolean()
  @ApiPropertyOptional({ description: 'Whether the room is active' })
  isActive?: boolean;
}
