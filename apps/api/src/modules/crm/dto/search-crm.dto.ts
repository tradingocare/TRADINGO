import { IsOptional, IsString, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class SearchCrmDto {
  @IsString()
  @ApiProperty({ description: 'Search query' })
  q: string;
  @IsOptional() @IsNumber() @Type(() => Number)
  @ApiPropertyOptional({ description: 'Page number' })
  page?: number;
  @IsOptional() @IsNumber() @Type(() => Number)
  @ApiPropertyOptional({ description: 'Items per page' })
  limit?: number;
}
