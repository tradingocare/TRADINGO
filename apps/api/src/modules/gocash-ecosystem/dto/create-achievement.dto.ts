import { IsString, IsOptional, IsInt, IsNumber, Min, IsBoolean, IsObject } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateAchievementDto {
  @IsString()
  @ApiProperty({ description: 'Achievement name' })
  name!: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ description: 'Achievement description' })
  description?: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ description: 'Achievement icon' })
  icon?: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ description: 'Achievement color' })
  color?: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ description: 'Achievement category' })
  category?: string;

  @IsOptional()
  @IsObject()
  @ApiPropertyOptional({ description: 'Achievement criteria' })
  criteria?: any;

  @IsOptional()
  @IsInt()
  @Min(0)
  @ApiPropertyOptional({ description: 'XP reward' })
  xpReward?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @ApiPropertyOptional({ description: 'GOCASH reward' })
  gocashReward?: number;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ description: 'Badge ID awarded on completion' })
  badgeId?: string;

  @IsOptional()
  @IsInt()
  @ApiPropertyOptional({ description: 'Sort order' })
  sortOrder?: number;

  @IsOptional()
  @IsBoolean()
  @ApiPropertyOptional({ description: 'Hidden achievement flag' })
  hidden?: boolean;
}
