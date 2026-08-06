import { IsString, IsOptional, IsInt, Min, Max, IsBoolean } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateReviewDto {
  @IsInt()
  @Min(1)
  @Max(5)
  @ApiProperty({ description: 'Rating (1-5)' })
  rating: number;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ description: 'Review title' })
  title?: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ description: 'Review content' })
  review?: string;

  @IsOptional()
  @IsBoolean()
  @ApiPropertyOptional({ description: 'Whether purchase is verified' })
  isVerifiedPurchase?: boolean;
}
