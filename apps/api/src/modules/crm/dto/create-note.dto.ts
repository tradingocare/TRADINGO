import { IsString, IsOptional, IsBoolean, IsArray } from 'class-validator';

export class CreateNoteDto {
  @IsString() content: string;
  @IsOptional() @IsBoolean() isPinned?: boolean;
  @IsOptional() @IsArray() @IsString({ each: true }) mentions?: string[];
  @IsOptional() attachments?: Array<{ name: string; url: string; type: string }>;
}

export class UpdateNoteDto {
  @IsOptional() @IsString() content?: string;
  @IsOptional() @IsBoolean() isPinned?: boolean;
  @IsOptional() @IsArray() @IsString({ each: true }) mentions?: string[];
  @IsOptional() attachments?: Array<{ name: string; url: string; type: string }>;
}
