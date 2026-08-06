import { IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class CatalogDashboardDto {
  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ description: 'Company ID filter' })
  companyId?: string;
}
