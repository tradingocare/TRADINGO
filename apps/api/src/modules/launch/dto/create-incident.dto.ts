import { IsString, IsEnum, IsOptional, IsArray } from 'class-validator';
import { IncidentSeverity } from '@prisma/client';

export class CreateIncidentDto {
  @IsString()
  title: string;

  @IsString()
  description: string;

  @IsEnum(IncidentSeverity)
  severity: IncidentSeverity;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  impactedServices?: string[];

  @IsOptional()
  @IsString()
  reportedBy?: string;
}
