import { IsOptional, IsString } from 'class-validator';

export class VerifyChecklistDto {
  @IsOptional()
  @IsString()
  notes?: string;
}
