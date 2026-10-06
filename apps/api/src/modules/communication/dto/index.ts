import { IsString, IsOptional, IsArray, IsBoolean, IsEnum } from 'class-validator';
import { MessageType } from '@prisma/client';

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
  // P1-02 Part 3 — free-string type is rejected at the DTO boundary
  // (global ValidationPipe: whitelist + forbidNonWhitelisted); omitted
  // type keeps defaulting to TEXT in the service.
  @IsOptional()
  @IsEnum(MessageType)
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

/**
 * P1-02 Part 1 — open-or-create a 1:1 contact conversation.
 * The frontend legitimately knows the target company (+optional product);
 * participant userIds are resolved server-side (public company payloads
 * deliberately strip owner user ids, so the client must never supply them).
 */
export class OpenConversationDto {
  @IsString()
  companyId: string;

  @IsOptional()
  @IsString()
  productId?: string;

  @IsOptional()
  @IsString()
  title?: string;
}
