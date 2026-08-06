import { IsString, IsOptional, MinLength, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class SendSmsDto {
  @IsString()
  @MinLength(10)
  @MaxLength(15)
  @ApiProperty({ description: 'Phone number (10-15 digits)' })
  phoneNumber: string;

  @IsString()
  @MinLength(1)
  @MaxLength(1600)
  @ApiProperty({ description: 'SMS message (max 1600 chars)' })
  message: string;
}

export class SendTestSmsDto {
  @IsString()
  @MinLength(10)
  @MaxLength(15)
  @ApiProperty({ description: 'Phone number (10-15 digits)' })
  phoneNumber: string;

  @IsString()
  @IsOptional()
  @ApiPropertyOptional({ description: 'SMS template name' })
  template?: string;
}

export class SmsQueryDto {
  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ description: 'Phone number filter' })
  phoneNumber?: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ description: 'Status filter' })
  status?: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ description: 'Template filter' })
  template?: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ description: 'Start date' })
  startDate?: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ description: 'End date' })
  endDate?: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ description: 'Page number' })
  page?: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ description: 'Page limit' })
  limit?: string;
}
