import { IsString, IsOptional, IsBoolean, IsArray } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateNoteDto {
  @IsString()
  @ApiProperty({ description: 'Note content' })
  content: string;
  @IsOptional() @IsBoolean()
  @ApiPropertyOptional({ description: 'Is note pinned' })
  isPinned?: boolean;
  @IsOptional() @IsArray() @IsString({ each: true })
  @ApiPropertyOptional({ description: 'Mentioned user IDs' })
  mentions?: string[];
  @IsOptional()
  @ApiPropertyOptional({ description: 'Attachments' })
  attachments?: Array<{ name: string; url: string; type: string }>;
}

export class UpdateNoteDto {
  @IsOptional() @IsString()
  @ApiPropertyOptional({ description: 'Note content' })
  content?: string;
  @IsOptional() @IsBoolean()
  @ApiPropertyOptional({ description: 'Is note pinned' })
  isPinned?: boolean;
  @IsOptional() @IsArray() @IsString({ each: true })
  @ApiPropertyOptional({ description: 'Mentioned user IDs' })
  mentions?: string[];
  @IsOptional()
  @ApiPropertyOptional({ description: 'Attachments' })
  attachments?: Array<{ name: string; url: string; type: string }>;
}
