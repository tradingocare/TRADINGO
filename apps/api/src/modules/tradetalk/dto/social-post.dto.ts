import { IsString, IsOptional, IsEnum, IsArray, IsUUID, IsInt, Min, Max, MinLength, MaxLength } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { SocialPostType, SocialContentStatus } from '@prisma/client';

export class CreatePostDto {
  @IsString()
  @MinLength(1)
  @MaxLength(10000)
  @ApiProperty({ description: 'Post content (Markdown supported)' })
  content: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  @ApiPropertyOptional({ description: 'Optional post title' })
  title?: string;

  @IsOptional()
  @IsEnum(SocialPostType)
  @ApiPropertyOptional({ description: 'Post type', enum: SocialPostType })
  type?: SocialPostType;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @ApiPropertyOptional({ description: 'Uploaded media URLs' })
  mediaUrls?: string[];

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ description: 'Shared link URL' })
  linkUrl?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  @ApiPropertyOptional({ description: 'Link preview title' })
  linkTitle?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  @ApiPropertyOptional({ description: 'Link preview description' })
  linkDescription?: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ description: 'Link preview image URL' })
  linkImage?: string;

  @IsOptional()
  @IsUUID()
  @ApiPropertyOptional({ description: 'Room ID within community' })
  roomId?: string;
}

export class UpdatePostDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(10000)
  @ApiPropertyOptional({ description: 'Post content (Markdown supported)' })
  content?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  @ApiPropertyOptional({ description: 'Optional post title' })
  title?: string;

  @IsOptional()
  @IsEnum(SocialPostType)
  @ApiPropertyOptional({ description: 'Post type', enum: SocialPostType })
  type?: SocialPostType;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @ApiPropertyOptional({ description: 'Uploaded media URLs' })
  mediaUrls?: string[];

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ description: 'Shared link URL' })
  linkUrl?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  @ApiPropertyOptional({ description: 'Link preview title' })
  linkTitle?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  @ApiPropertyOptional({ description: 'Link preview description' })
  linkDescription?: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ description: 'Link preview image URL' })
  linkImage?: string;

  @IsOptional()
  @IsEnum(SocialContentStatus)
  @ApiPropertyOptional({ description: 'Post status', enum: SocialContentStatus })
  status?: SocialContentStatus;

  @IsOptional()
  @IsUUID()
  @ApiPropertyOptional({ description: 'Room ID within community' })
  roomId?: string;
}

export class PostFilterDto {
  @IsOptional()
  @IsEnum(SocialPostType)
  @ApiPropertyOptional({ description: 'Filter by post type', enum: SocialPostType })
  type?: SocialPostType;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ description: 'Search in content' })
  search?: string;

  @IsOptional()
  @IsUUID()
  @ApiPropertyOptional({ description: 'Filter by room ID' })
  roomId?: string;

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

export class LikeResponseDto {
  @ApiProperty({ description: 'Whether the post is now liked' })
  liked: boolean;
  @ApiProperty({ description: 'Updated like count' })
  likeCount: number;
}

export class ShareResponseDto {
  @ApiProperty({ description: 'Updated share count' })
  shareCount: number;
}

export class BookmarkResponseDto {
  @ApiProperty({ description: 'Whether the post is now bookmarked' })
  bookmarked: boolean;
}

// ═══ Comments ═══════════════════════════════════════════════════════════

export class SendCommentDto {
  @IsString()
  @MinLength(1)
  @MaxLength(5000)
  @ApiProperty({ description: 'Comment content' })
  content: string;

  @IsOptional()
  @IsUUID()
  @ApiPropertyOptional({ description: 'Reply to a specific comment ID' })
  replyToId?: string;
}

export class CommentFilterDto {
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
  @ApiPropertyOptional({ description: 'Items per page', default: 50 })
  limit?: number;
}
