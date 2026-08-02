import { IsString, IsOptional, IsDateString, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CrmFollowUpStatus } from '@prisma/client';

export class CreateFollowUpDto {
  @IsString()
  @ApiProperty({ description: 'Follow-up title' })
  title: string;
  @IsOptional() @IsString()
  @ApiPropertyOptional({ description: 'Follow-up description' })
  description?: string;
  @IsDateString()
  @ApiProperty({ description: 'Due date (ISO 8601)' })
  dueDate: string;
  @IsOptional() @IsEnum(CrmFollowUpStatus)
  @ApiPropertyOptional({ description: 'Follow-up status', enum: CrmFollowUpStatus })
  status?: CrmFollowUpStatus;
  @IsOptional() @IsString()
  @ApiPropertyOptional({ description: 'Assigned user ID' })
  assignedTo?: string;
}

export class UpdateFollowUpDto {
  @IsOptional() @IsString()
  @ApiPropertyOptional({ description: 'Follow-up title' })
  title?: string;
  @IsOptional() @IsString()
  @ApiPropertyOptional({ description: 'Follow-up description' })
  description?: string;
  @IsOptional() @IsDateString()
  @ApiPropertyOptional({ description: 'Due date (ISO 8601)' })
  dueDate?: string;
  @IsOptional() @IsEnum(CrmFollowUpStatus)
  @ApiPropertyOptional({ description: 'Follow-up status', enum: CrmFollowUpStatus })
  status?: CrmFollowUpStatus;
  @IsOptional() @IsString()
  @ApiPropertyOptional({ description: 'Assigned user ID' })
  assignedTo?: string;
}
