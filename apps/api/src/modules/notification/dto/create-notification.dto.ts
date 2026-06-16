import { IsEnum, IsOptional, IsString, IsUUID, IsObject } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { NotificationChannel, NotificationPriority, NotificationType } from '@prisma/client';

export class CreateNotificationDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  userId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsEnum(NotificationType)
  type?: NotificationType;

  @ApiPropertyOptional()
  @IsOptional()
  @IsEnum(NotificationChannel)
  channel?: NotificationChannel;

  @ApiPropertyOptional()
  @IsOptional()
  @IsEnum(NotificationPriority)
  priority?: NotificationPriority;

  @IsString()
  title: string;

  @IsString()
  body: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  link?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  imageUrl?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  sourceModule?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  sourceId?: string;
}

export class CreateBulkNotificationDto {
  @IsUUID('4', { each: true })
  userIds: string[];

  @IsOptional()
  @IsEnum(NotificationType)
  type?: NotificationType;

  @IsString()
  title: string;

  @IsString()
  body: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  link?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  sourceModule?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  sourceId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsEnum(NotificationChannel)
  channel?: NotificationChannel;

  @ApiPropertyOptional()
  @IsOptional()
  @IsEnum(NotificationPriority)
  priority?: NotificationPriority;
}
