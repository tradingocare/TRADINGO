import { IsBoolean, IsEnum, IsOptional } from 'class-validator';
import { NotificationChannel, NotificationType } from '@prisma/client';

export class UpsertPreferenceDto {
  @IsEnum(NotificationChannel)
  channel: NotificationChannel;

  @IsOptional()
  @IsEnum(NotificationType)
  type?: NotificationType;

  @IsBoolean()
  enabled: boolean;
}
