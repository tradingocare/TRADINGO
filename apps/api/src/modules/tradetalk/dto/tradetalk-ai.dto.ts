import { IsString, IsOptional, IsInt, Min, Max, IsArray } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class GeneratePostDto {
  @ApiProperty() @IsString() topic: string;
  @ApiPropertyOptional() @IsOptional() @IsString() tone?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() audience?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() keywords?: string;
}

export class RewritePostDto {
  @ApiProperty() @IsString() content: string;
  @ApiPropertyOptional() @IsOptional() @IsString() style?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() audience?: string;
}

export class ContentDto {
  @ApiProperty() @IsString() content: string;
}

export class SummarizeContentDto {
  @ApiProperty() @IsString() content: string;
  @ApiPropertyOptional() @IsOptional() @IsInt() @Min(50) @Max(2000) maxLength?: number;
}

export class TranslateContentDto {
  @ApiProperty() @IsString() content: string;
  @ApiProperty() @IsString() targetLanguage: string;
  @ApiPropertyOptional() @IsOptional() @IsString() sourceLanguage?: string;
}

export class SuggestHashtagsDto {
  @ApiProperty() @IsString() content: string;
  @ApiPropertyOptional() @IsOptional() @IsInt() @Min(1) @Max(20) maxCount?: number;
}

export class SuggestTitleDto {
  @ApiProperty() @IsString() content: string;
}

export class DetectSpamDto {
  @ApiProperty() @IsString() content: string;
  @ApiPropertyOptional() @IsOptional() @IsString() communityId?: string;
}

export class DetectDuplicateContentDto {
  @ApiProperty() @IsString() content: string;
  @ApiPropertyOptional() @IsOptional() @IsString() communityId?: string;
}

export class DetectOffensiveDto {
  @ApiProperty() @IsString() content: string;
}

export class DetectUnsafeLinksDto {
  @ApiProperty() @IsString() content: string;
  @ApiPropertyOptional() @IsOptional() @IsString() linkUrl?: string;
}

export class RecommendContentStatusDto {
  @ApiProperty() @IsString() content: string;
  @ApiPropertyOptional() @IsOptional() @IsString() communityId?: string;
}

export class SuggestPostingTimeDto {
  @ApiPropertyOptional() @IsOptional() @IsString() communityId?: string;
}

export class SuggestCategoriesDto {
  @ApiProperty() @IsString() content: string;
}

export class SuggestCommunitiesForContentDto {
  @ApiProperty() @IsString() content: string;
  @ApiPropertyOptional() @IsOptional() @IsArray() @IsString({ each: true }) excludeIds?: string[];
}
