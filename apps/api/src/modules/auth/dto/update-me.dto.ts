import { IsOptional, IsString, Matches, IsObject, ValidateNested, MinLength } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

class NotificationPreferencesDto {
  @IsOptional()
  @IsObject()
  @ApiPropertyOptional({
    description: 'Notification toggles keyed by label (e.g. "Quote Received", "Order Updates")',
    type: Object,
  })
  notifications?: Record<string, boolean>;
}

export class UpdateMeDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @ApiPropertyOptional({ description: 'Display name' })
  name?: string;

  @IsOptional()
  @IsString()
  @Matches(/^[6-9]\d{9}$/, { message: 'Mobile must be a valid Indian 10-digit number' })
  @ApiPropertyOptional({ description: 'Mobile number (10 digits)' })
  mobile?: string;

  @IsOptional()
  @IsObject()
  @ApiPropertyOptional({
    description: 'Notification toggles keyed by label (accepted at top level for backward compatibility)',
    type: Object,
  })
  notifications?: Record<string, boolean>;

  @IsOptional()
  @ValidateNested()
  @Type(() => NotificationPreferencesDto)
  @ApiPropertyOptional({ description: 'Nested preferences object', type: NotificationPreferencesDto })
  preferences?: NotificationPreferencesDto;
}
