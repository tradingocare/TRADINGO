import { IsString, IsOptional, IsEnum, IsInt, IsNumber, Min, IsObject } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { EcosystemMissionPeriod, EcosystemMissionActionType } from '@prisma/client';

export class UpdateMissionDto {
  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ description: 'Mission name' })
  name?: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ description: 'Mission description' })
  description?: string;

  @IsOptional()
  @IsEnum(EcosystemMissionPeriod)
  @ApiPropertyOptional({ description: 'Mission period', enum: EcosystemMissionPeriod })
  period?: EcosystemMissionPeriod;

  @IsOptional()
  @IsEnum(EcosystemMissionActionType)
  @ApiPropertyOptional({ description: 'Action type', enum: EcosystemMissionActionType })
  actionType?: EcosystemMissionActionType;

  @IsOptional()
  @IsInt()
  @Min(1)
  @ApiPropertyOptional({ description: 'Target count to complete mission' })
  targetCount?: number;

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
