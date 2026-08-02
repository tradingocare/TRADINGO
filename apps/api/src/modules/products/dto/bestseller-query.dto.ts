import { IsOptional, IsInt, Min, Max, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class BestsellerQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  @ApiPropertyOptional({ description: 'Maximum results (1-100)' })
  limit?: number;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ description: 'City filter' })
  city?: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ description: 'State filter' })
  state?: string;
}
