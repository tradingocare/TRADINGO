import { IsString, IsOptional, IsArray, IsBoolean } from 'class-validator';

export class CreateConversationDto {
  @IsString()
  type: string;

  @IsString()
  source: string;

  @IsOptional()
  @IsString()
  sourceId?: string;

  @IsOptional()
  @IsString()
  title?: string;

  @IsString()
  companyId: string;

  @IsArray()
  participants: { companyId: string; userId: string; role?: string }[];
}

export class SendMessageDto {
  @IsOptional()
  @IsString()
  type?: string;

  @IsOptional()
  @IsString()
  content?: string;

  @IsOptional()
  @IsString()
  replyToId?: string;

  @IsOptional()
  @IsArray()
  attachments?: { type: string; url: string; originalName?: string; mimeType?: string; fileSize?: number }[];
}

export class UpdateTemplateDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  content?: string;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsBoolean()
  isShared?: boolean;
}

export class CreateTemplateDto {
  @IsString()
  title: string;

  @IsString()
  content: string;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsBoolean()
  isShared?: boolean;
}

export class CreateLabelDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  color?: string;
}

export class UpdateLabelDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  color?: string;
}

export class ReportMessageDto {
  @IsString()
  reason: string;

  @IsOptional()
  @IsString()
  description?: string;
}

export class AddParticipantDto {
  @IsString()
  companyId: string;

  @IsString()
  userId: string;
}
