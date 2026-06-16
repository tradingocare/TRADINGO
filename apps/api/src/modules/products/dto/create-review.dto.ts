import { IsString, IsOptional, IsInt, Min, Max, IsBoolean } from 'class-validator';

export class CreateReviewDto {
  @IsInt()
  @Min(1)
  @Max(5)
  rating: number;

  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  review?: string;

  @IsOptional()
  @IsBoolean()
  isVerifiedPurchase?: boolean;
}
