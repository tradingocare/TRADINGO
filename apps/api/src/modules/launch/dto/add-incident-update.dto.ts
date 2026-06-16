import { IsString, IsEnum } from 'class-validator';
import { IncidentStatus } from '@prisma/client';

export class AddIncidentUpdateDto {
  @IsString()
  message: string;

  @IsEnum(IncidentStatus)
  status: IncidentStatus;
}
