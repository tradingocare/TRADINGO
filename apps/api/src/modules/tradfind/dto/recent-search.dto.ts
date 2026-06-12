import { IsOptional, IsInt, Min, Max, IsString } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class RecentSearchQueryDto {
  @ApiProperty({ description: 'Max recent searches', required: false, default: 10, maximum: 50 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  limit?: number = 10;
}

export class DeleteRecentSearchDto {
  @ApiProperty({ description: 'Search ID to delete (omit to clear all)', required: false })
  @IsOptional()
  @IsString()
  searchId?: string;
}
