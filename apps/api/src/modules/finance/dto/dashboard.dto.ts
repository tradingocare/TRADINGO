import { IsOptional, IsNumber, IsString, IsDateString } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class QueryFinanceDashboardDto {
  @IsOptional() @IsDateString()
  @ApiPropertyOptional({ description: 'Start date (ISO 8601)' })
  startDate?: string;
  @IsOptional() @IsDateString()
  @ApiPropertyOptional({ description: 'End date (ISO 8601)' })
  endDate?: string;
  @IsOptional() @IsString()
  @ApiPropertyOptional({ description: 'Company ID' })
  companyId?: string;
  @IsOptional() @IsNumber() @Type(() => Number)
  @ApiPropertyOptional({ description: 'Number of months' })
  months?: number;
}
