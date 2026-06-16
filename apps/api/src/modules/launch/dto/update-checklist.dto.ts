import { IsEnum, IsOptional, IsString } from 'class-validator';
import { ChecklistStatus } from '@prisma/client';

export class UpdateChecklistDto {
  @IsEnum(ChecklistStatus)
  status: ChecklistStatus;

  @IsOptional()
  @IsString()
  notes?: string;
}
