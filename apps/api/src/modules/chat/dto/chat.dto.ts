import { IsString, IsOptional, IsArray, IsEnum, IsNumber, Max, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateConversationDto {
  @IsEnum(['DIRECT', 'RFQ_NEGOTIATION', 'ORDER'])
  type: 'DIRECT' | 'RFQ_NEGOTIATION' | 'ORDER';

  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  rfqId?: string;

  @IsArray()
  @IsString({ each: true })
  participantCompanyIds: string[];
}

export class SendMessageDto {
  @IsOptional()
  @IsString()
  content?: string;

  @IsOptional()
  @IsString()
  replyToId?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FileDto)
  attachments?: FileDto[];
}

export class FileDto {
  @IsString()
  type: string;

  @IsString()
  url: string;

  @IsOptional()
  @IsString()
  originalName?: string;

  @IsOptional()
  @IsString()
  mimeType?: string;

  @IsOptional()
  @IsNumber()
  fileSize?: number;

  @IsOptional()
  @IsNumber()
  width?: number;

  @IsOptional()
  @IsNumber()
  height?: number;

  @IsOptional()
  @IsNumber()
  duration?: number;
}

export class SearchMessagesDto {
  @IsString()
  q: string;

  @IsOptional()
  @IsNumber()
  page?: number = 1;

  @IsOptional()
  @IsNumber()
  @Max(50)
  limit?: number = 20;
}

export class ReportMessageDto {
  @IsString()
  reason: string;

  @IsOptional()
  @IsString()
  description?: string;
}

export class UploadUrlDto {
  @IsString()
  fileName: string;

  @IsString()
  mimeType: string;

  @IsNumber()
  fileSize: number;
}
