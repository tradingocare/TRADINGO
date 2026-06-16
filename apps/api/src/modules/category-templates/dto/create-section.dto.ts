import { IsString, IsOptional, IsInt, Min } from 'class-validator';

export class CreateSectionDto {
  @IsString()
  key: string;

  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;

  @IsOptional()
  @IsString()
  icon?: string;
}
