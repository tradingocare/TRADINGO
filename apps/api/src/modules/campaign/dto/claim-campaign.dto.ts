import { IsString, IsOptional, IsObject } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ClaimCampaignDto {
  @IsString()
  @ApiProperty({ description: 'Campaign ID' })
  campaignId: string;

  /**
   * P0-SEC-01: accepted only for web-payload compatibility.
   * IGNORED for authorization/credit identity — always derived from the
   * authenticated session server-side.
   */
  @IsOptional() @IsString()
  @ApiPropertyOptional({ description: 'Deprecated: ignored; derived from authenticated session' })
  companyId?: string;

  @IsOptional() @IsString()
  @ApiPropertyOptional({ description: 'Claim type' })
  claimType?: string;

  @IsOptional() @IsObject()
  @ApiPropertyOptional({ description: 'Additional metadata' })
  metadata?: Record<string, unknown>;
}
