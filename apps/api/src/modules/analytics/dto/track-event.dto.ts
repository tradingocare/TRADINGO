import { IsString, IsOptional, IsNumber, IsObject } from 'class-validator';

export class TrackEventDto {
  @IsString()
  companyId: string;

  @IsString()
  eventType: string;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;

  @IsOptional()
  @IsString()
  userId?: string;

  @IsOptional()
  @IsNumber()
  amount?: number;

  @IsOptional()
  @IsString()
  currency?: string;

  @IsOptional()
  @IsString()
  status?: string;

  [key: string]: unknown;
}
