import { IsString, IsOptional, IsNumber, IsEnum, IsDateString, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CollectionActionType } from '@prisma/client';

export class CreateCollectionNoteDto {
  @IsEnum(CollectionActionType)
  @ApiProperty({ description: 'Collection action type', enum: CollectionActionType })
  actionType: CollectionActionType;
  @IsString()
  @ApiProperty({ description: 'Note content' })
  content: string;
  @IsOptional() @IsString()
  @ApiPropertyOptional({ description: 'Contacted person name' })
  contactedPerson?: string;
  @IsOptional() @IsString()
  @ApiPropertyOptional({ description: 'Call outcome' })
  outcome?: string;
  @IsOptional() @IsDateString()
  @ApiPropertyOptional({ description: 'Follow-up date (ISO 8601)' })
  followUpAt?: string;
}

export class UpdateCollectionNoteDto {
  @IsOptional() @IsString()
  @ApiPropertyOptional({ description: 'Note content' })
  content?: string;
  @IsOptional() @IsString()
  @ApiPropertyOptional({ description: 'Call outcome' })
  outcome?: string;
  @IsOptional() @IsDateString()
  @ApiPropertyOptional({ description: 'Follow-up date (ISO 8601)' })
  followUpAt?: string;
}

export class QueryCollectionsDto {
  @IsOptional() @IsString()
  @ApiPropertyOptional({ description: 'Search query' })
  search?: string;
  @IsOptional() @IsNumber() @Type(() => Number)
  @ApiPropertyOptional({ description: 'Minimum overdue days' })
  minOverdueDays?: number;
  @IsOptional() @IsNumber() @Type(() => Number)
  @ApiPropertyOptional({ description: 'Maximum overdue days' })
  maxOverdueDays?: number;
  @IsOptional() @IsNumber() @Type(() => Number)
  @ApiPropertyOptional({ description: 'Minimum amount' })
  minAmount?: number;
  @IsOptional() @IsNumber() @Type(() => Number)
  @ApiPropertyOptional({ description: 'Page number' })
  page?: number;
  @IsOptional() @IsNumber() @Type(() => Number)
  @ApiPropertyOptional({ description: 'Items per page' })
  limit?: number;
}
