import { IsString, IsOptional, IsEnum, IsBoolean, IsInt, Min, IsObject } from 'class-validator';
import { TemplateFieldType } from '@prisma/client';

export class CreateFieldDto {
  @IsString()
  key: string;

  @IsString()
  label: string;

  @IsEnum(TemplateFieldType)
  type: TemplateFieldType;

  @IsOptional()
  @IsString()
  placeholder?: string;

  @IsOptional()
  @IsString()
  helpText?: string;

  @IsOptional()
  @IsObject()
  defaultValue?: any;

  @IsOptional()
  @IsObject()
  options?: any;

  @IsOptional()
  @IsString()
  unit?: string;

  @IsOptional()
  @IsObject()
  validation?: any;

  @IsOptional()
  @IsObject()
  visibility?: any;

  @IsOptional()
  @IsObject()
  metadata?: any;

  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;

  @IsOptional()
  @IsBoolean()
  isRequired?: boolean;
}
