import { IsOptional, IsInt, Min, Max } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class GrowthQueryDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(365)
  @ApiPropertyOptional({ description: 'Days of data to analyze', default: 30 })
  days?: number;
}

export class AcquisitionFunnelDto {
  totalVisitors: number;
  registrationsStarted: number;
  registrationsCompleted: number;
  referralApplied: number;
  firstOrder: number;
  funnelSteps: Array<{ step: string; count: number; dropOff: number; dropOffRate: string }>;
}

export class CampaignPerformanceDto {
  campaign: string;
  source: string;
  medium: string;
  impressions: number;
  clicks: number;
  registrations: number;
  conversionRate: string;
}

export class ReferralConversionDto {
  totalReferralCodes: number;
  totalReferrals: number;
  rewardedCount: number;
  conversionRate: string;
  topReferrers: Array<{ userId: string; count: number }>;
}

export class LeadConversionDto {
  totalLeads: number;
  convertedLeads: number;
  conversionRate: string;
  bySource: Array<{ source: string; count: number; converted: number }>;
}

export class TopLandingPageDto {
  pageUrl: string;
  visits: number;
  registrations: number;
}

export class TrafficSourceDto {
  channel: string;
  visits: number;
  percentage: string;
}
