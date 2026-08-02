import { IsString, IsOptional, IsObject } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class TrackEventDto {
  @IsString()
  @ApiProperty({ description: 'Event name' })
  event: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ description: 'User ID (if authenticated)' })
  userId?: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ description: 'Session ID' })
  sessionId?: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ description: 'Page URL' })
  pageUrl?: string;

  @IsOptional()
  @IsObject()
  @ApiPropertyOptional({ description: 'Event properties' })
  properties?: Record<string, unknown>;

  @IsOptional()
  @IsObject()
  @ApiPropertyOptional({ description: 'UTM parameters' })
  utm?: Record<string, string>;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ description: 'User agent' })
  userAgent?: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ description: 'IP address' })
  ipAddress?: string;
}
