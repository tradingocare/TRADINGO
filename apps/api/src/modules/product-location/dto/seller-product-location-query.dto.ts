import { IsOptional, IsString, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';

export class SellerProductLocationQueryDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsEnum(['set', 'missing'])
  locationStatus?: 'set' | 'missing';

  @IsOptional()
  @Type(() => Number)
  page?: number;

  @IsOptional()
  @Type(() => Number)
  limit?: number;
}
