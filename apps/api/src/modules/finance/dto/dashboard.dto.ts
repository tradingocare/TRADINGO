import { IsOptional, IsNumber, IsString, IsDateString } from 'class-validator';
import { Type } from 'class-transformer';

export class QueryFinanceDashboardDto {
  @IsOptional() @IsDateString() startDate?: string;
  @IsOptional() @IsDateString() endDate?: string;
  @IsOptional() @IsString() companyId?: string;
  @IsOptional() @IsNumber() @Type(() => Number) months?: number;
}
