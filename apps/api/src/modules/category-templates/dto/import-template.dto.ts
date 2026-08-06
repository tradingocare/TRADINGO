import { IsString, IsOptional, IsArray, IsNumber, IsBoolean, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class ImportFieldDto {
  @IsString()
  key: string;

  @IsString()
  label: string;

  @IsString()
  type: string;

  @IsOptional()
  @IsString()
  placeholder?: string;

  @IsOptional()
  @IsString()
  helpText?: string;

  @IsOptional()
  defaultValue?: any;

  @IsOptional()
  options?: any;

  @IsOptional()
  @IsString()
  unit?: string;

  @IsOptional()
  validation?: any;

  @IsOptional()
  visibility?: any;

  @IsOptional()
  metadata?: any;

  @IsOptional()
  @IsNumber()
  sortOrder?: number;

  @IsOptional()
  @IsBoolean()
  isRequired?: boolean;
}

class ImportSectionDto {
  @IsString()
  key: string;

  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsNumber()
  sortOrder?: number;

  @IsOptional()
  @IsString()
  icon?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ImportFieldDto)
  fields?: ImportFieldDto[];
}

export class ImportTemplateDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ImportSectionDto)
  sections?: ImportSectionDto[];
}