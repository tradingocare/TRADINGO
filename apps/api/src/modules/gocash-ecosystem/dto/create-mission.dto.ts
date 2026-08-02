import { IsString, IsOptional, IsEnum, IsInt, IsNumber, Min, IsBoolean, IsObject } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { EcosystemMissionPeriod, EcosystemMissionActionType } from '@prisma/client';

export class CreateMissionDto {
  @IsString()
  @ApiProperty({ description: 'Mission name' })
  name!: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ description: 'Mission description' })
  description?: string;

  @IsEnum(EcosystemMissionPeriod)
  @ApiProperty({ description: 'Mission period', enum: EcosystemMissionPeriod })
  period!: EcosystemMissionPeriod;

  @IsEnum(EcosystemMissionActionType)
  @ApiProperty({ description: 'Action type', enum: EcosystemMissionActionType })
  actionType!: EcosystemMissionActionType;

  @IsInt()
  @Min(1)
  @ApiProperty({ description: 'Target count to complete mission' })
  targetCount!: number;

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
  @IsObject()
  @ApiPropertyOptional({ description: 'Mission requirements' })
  requirements?: any;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ description: 'Start date' })
  startDate?: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ description: 'End date' })
  endDate?: string;

  @IsOptional()
  @IsInt()
  @ApiPropertyOptional({ description: 'Sort order' })
  sortOrder?: number;
}
