import { IsString, IsOptional, IsEnum, IsArray } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CommunityVisibility, CommunityJoinSetting } from '@prisma/client';

export class CreateCommunityDto {
  @IsString()
  @ApiProperty({ description: 'Community name' })
  name: string;
  @IsString()
  @ApiProperty({ description: 'URL slug' })
  slug: string;
  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ description: 'Short description' })
  description?: string;
  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ description: 'Long description' })
  longDescription?: string;
  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ description: 'Logo URL' })
  logo?: string;
  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ description: 'Banner URL' })
  banner?: string;
  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ description: 'Category ID' })
  categoryId?: string;
  @IsOptional()
  @IsEnum(CommunityVisibility)
  @ApiPropertyOptional({ description: 'Community visibility', enum: CommunityVisibility })
  visibility?: CommunityVisibility;
  @IsOptional()
  @IsEnum(CommunityJoinSetting)
  @ApiPropertyOptional({ description: 'Join setting', enum: CommunityJoinSetting })
  joinSetting?: CommunityJoinSetting;
  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ description: 'Company ID (owner)' })
  companyId?: string;
  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ description: 'Community rules/guidelines (Markdown)' })
  rules?: string;
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @ApiPropertyOptional({ description: 'Community tags' })
  tags?: string[];
}
