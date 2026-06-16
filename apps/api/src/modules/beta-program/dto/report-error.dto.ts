import { IsString, IsOptional, IsObject } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ReportErrorDto {
  @ApiProperty()
  @IsString()
  errorType: string;

  @ApiProperty()
  @IsString()
  errorMessage: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  stackTrace?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  page?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  action?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;
}
