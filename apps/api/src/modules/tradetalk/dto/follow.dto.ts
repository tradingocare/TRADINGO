import { IsString, IsOptional, IsEnum, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { FollowType } from '@prisma/client';

export class FollowDto {
  @IsString()
  @ApiProperty({ description: 'ID of the user or company to follow' })
  followingId: string;

  @IsOptional()
  @IsEnum(FollowType)
  @ApiPropertyOptional({ description: 'Type of entity to follow', enum: FollowType, default: 'USER' })
  followingType?: FollowType;
}

export class FollowCheckDto {
  @IsString()
  @ApiProperty({ description: 'Entity ID to check' })
  followingId: string;

  @IsOptional()
  @IsEnum(FollowType)
  @ApiPropertyOptional({ description: 'Type of entity', enum: FollowType, default: 'USER' })
  followingType?: FollowType;
}

export class FollowQueryDto {
  @IsOptional()
  @IsEnum(FollowType)
  @ApiPropertyOptional({ description: 'Type of entity', enum: FollowType, default: 'USER' })
  followingType?: FollowType;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @ApiPropertyOptional({ description: 'Page number', default: 1 })
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  @ApiPropertyOptional({ description: 'Items per page', default: 20 })
  limit?: number;
}

export class FollowCountsResponseDto {
  @ApiProperty({ description: 'Number of followers' })
  followers: number;

  @ApiProperty({ description: 'Number of followed entities' })
  following: number;
}

export class FollowToggleResponseDto {
  @ApiProperty({ description: 'Whether the follow is active' })
  following: boolean;
}

export class FollowUserResponseDto {
  @ApiProperty({ description: 'User ID' })
  id: string;

  @ApiProperty({ description: 'User display name' })
  name: string;

  @ApiProperty({ description: 'User email' })
  email: string;

  @ApiPropertyOptional({ description: 'Avatar URL' })
  avatar?: string;

  @ApiProperty({ description: 'When the follow happened' })
  followedAt: string;
}

export class FollowListResponseDto {
  @ApiProperty({ type: [FollowUserResponseDto] })
  items: FollowUserResponseDto[];

  @ApiProperty({ description: 'Total count' })
  total: number;

  @ApiProperty({ description: 'Current page' })
  page: number;

  @ApiProperty({ description: 'Items per page' })
  limit: number;

  @ApiProperty({ description: 'Total pages' })
  totalPages: number;

  @ApiProperty({ description: 'Whether there is a next page' })
  hasNext: boolean;

  @ApiProperty({ description: 'Whether there is a previous page' })
  hasPrevious: boolean;
}
