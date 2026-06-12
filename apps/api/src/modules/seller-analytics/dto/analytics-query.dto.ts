import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsEnum } from 'class-validator';

export enum AnalyticsTimeRange {
  TODAY = 'TODAY',
  DAYS_7 = 'DAYS_7',
  DAYS_30 = 'DAYS_30',
  DAYS_90 = 'DAYS_90',
  YEAR_1 = 'YEAR_1',
  LIFETIME = 'LIFETIME',
}

export class AnalyticsQueryDto {
  @ApiPropertyOptional({ enum: AnalyticsTimeRange, default: 'DAYS_30' })
  @IsOptional()
  @IsEnum(AnalyticsTimeRange)
  range?: AnalyticsTimeRange;
}
