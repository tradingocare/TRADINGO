import { IsOptional, IsEnum, IsString } from 'class-validator';
import { IncidentSeverity, IncidentStatus } from '@prisma/client';
import { PaginationDto } from '../../../common/dto/pagination.dto';

export class PaginationQueryDto extends PaginationDto {
  @IsOptional()
  @IsEnum(IncidentStatus)
  status?: IncidentStatus;

  @IsOptional()
  @IsEnum(IncidentSeverity)
  severity?: IncidentSeverity;

  @IsOptional()
  @IsString()
  category?: string;
}
