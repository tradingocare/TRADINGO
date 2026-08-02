import { IsString, IsOptional, IsEnum, IsDateString, IsArray } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateNewsletterCampaignDto {
  @IsString()
  @ApiProperty({ description: 'Newsletter campaign name' })
  name: string;

  @IsString()
  @ApiProperty({ description: 'Email subject' })
  subject: string;

  @IsString()
  @ApiProperty({ description: 'Email body (HTML or markdown)' })
  body: string;

  @IsOptional() @IsString()
  @ApiPropertyOptional({ description: 'Template identifier' })
  template?: string;

  @IsOptional() @IsDateString()
  @ApiPropertyOptional({ description: 'Scheduled send date' })
  scheduledAt?: string;
}

export class UpdateNewsletterCampaignDto {
  @IsOptional() @IsString()
  @ApiPropertyOptional({ description: 'Newsletter campaign name' })
  name?: string;

  @IsOptional() @IsString()
  @ApiPropertyOptional({ description: 'Email subject' })
  subject?: string;

  @IsOptional() @IsString()
  @ApiPropertyOptional({ description: 'Email body (HTML or markdown)' })
  body?: string;

  @IsOptional() @IsString()
  @ApiPropertyOptional({ description: 'Template identifier' })
  template?: string;

  @IsOptional() @IsDateString()
  @ApiPropertyOptional({ description: 'Scheduled send date' })
  scheduledAt?: string;
}

export class NewsletterQueryDto {
  @IsOptional() @IsString()
  @ApiPropertyOptional({ description: 'Filter by status' })
  status?: string;

  @IsOptional() @IsString()
  @ApiPropertyOptional({ description: 'Search by name or subject' })
  search?: string;

  @IsOptional()
  page?: number;

  @IsOptional()
  limit?: number;
}

export class SubscribeDto {
  @IsString()
  @ApiProperty({ description: 'Subscriber email' })
  email: string;

  @IsOptional() @IsString()
  @ApiPropertyOptional({ description: 'Subscriber name' })
  name?: string;

  @IsOptional() @IsString()
  @ApiPropertyOptional({ description: 'Company ID' })
  companyId?: string;
}

export class SendNewsletterDto {
  @IsArray()
  @IsString({ each: true })
  @ApiProperty({ description: 'Recipient user IDs' })
  userIds: string[];

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ description: 'Override subject' })
  subject?: string;
}
