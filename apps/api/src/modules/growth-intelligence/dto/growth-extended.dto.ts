import { IsOptional, IsInt, Min, Max } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class CohortQueryDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(24)
  @ApiPropertyOptional({ description: 'Number of months to analyze', default: 12 })
  months?: number;
}

export class CohortDataDto {
  cohort: string; // e.g. "2024-01"
  periods: Array<{
    period: string;
    users: number;
    retained: number;
    retentionRate: string;
  }>;
}

export class RetentionAnalysisDto {
  overallRetentionRate: string;
  d7Retention: string;
  d30Retention: string;
  d90Retention: string;
  cohorts: CohortDataDto[];
}

export class LtvAnalysisDto {
  averageLtv: number;
  byCohort: Array<{
    cohort: string;
    averageLtv: number;
    orderCount: number;
  }>;
  byPlan: Array<{
    plan: string;
    averageLtv: number;
    customerCount: number;
  }>;
}

export class CacAnalysisDto {
  totalAcquisitionCost: number;
  totalCustomers: number;
  averageCac: number;
  cacByChannel: Array<{
    channel: string;
    cost: number;
    customers: number;
    cac: number;
  }>;
  ltvCacRatio: number;
}

export class AttributionDto {
  model: string; // first_touch, last_touch, linear, time_decay
  channels: Array<{
    channel: string;
    attributedRevenue: number;
    attributedOrders: number;
    percentage: string;
  }>;
}

export class CohortAnalysisDto {
  newUsers: number;
  returningUsers: number;
  retentionRate: string;
  monthlyCohorts: CohortDataDto[];
}

export class ChannelAttributionDto {
  firstTouch: AttributionDto;
  lastTouch: AttributionDto;
  linear: AttributionDto;
}
