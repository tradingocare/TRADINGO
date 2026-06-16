import { IsString, IsOptional, IsEnum } from 'class-validator';
import { TemplateStatus } from '@prisma/client';

export class CreateTemplateDto {
  @IsString()
  categoryId: string;

  @IsString()
  name: string;

  @IsOptional()
  @IsEnum(TemplateStatus)
  status?: TemplateStatus;
}
