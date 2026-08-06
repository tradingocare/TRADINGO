import { IsBoolean, IsEnum, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { NotificationChannel, NotificationType } from '@prisma/client';

export class UpsertPreferenceDto {
  @IsEnum(NotificationChannel)
  @ApiProperty({ description: 'Notification channel', enum: NotificationChannel })
  channel: NotificationChannel;

  @IsOptional()
  @IsEnum(NotificationType)
  @ApiPropertyOptional({ description: 'Notification type', enum: NotificationType })
  type?: NotificationType;

  @IsBoolean()
  @ApiProperty({ description: 'Whether notifications are enabled' })
  enabled: boolean;
}
