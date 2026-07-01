import { IsString, IsOptional, IsNumber, Min, IsObject } from 'class-validator';

export class ClaimCampaignDto {
  @IsString() campaignId: string;
  @IsOptional() @IsString() userId?: string;
  @IsOptional() @IsString() companyId?: string;
  @IsOptional() @IsString() claimType?: string;
  @IsOptional() @IsNumber() @Min(0) amount?: number;
  @IsOptional() @IsString() ipAddress?: string;
  @IsOptional() @IsString() userAgent?: string;
  @IsOptional() @IsObject() metadata?: Record<string, unknown>;
}
