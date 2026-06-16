import { IsString, IsOptional, IsNumber, Min, MaxLength } from 'class-validator';

export class CreateProductClaimDto {
  @IsString()
  productMasterId: string;

  @IsString()
  @MaxLength(500)
  name: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  shortDescription?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  unit?: string;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  price?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  moq?: number;

  @IsOptional()
  @IsString()
  notes?: string;
}
