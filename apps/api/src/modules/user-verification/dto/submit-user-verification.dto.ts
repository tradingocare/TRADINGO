import { IsString, IsEnum, IsOptional, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { VerificationLevel, DocumentType } from '@prisma/client';

class VerificationDocumentDto {
  @IsEnum(DocumentType)
  documentType: DocumentType;

  @IsString()
  documentUrl: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class SubmitUserVerificationDto {
  @IsEnum(VerificationLevel)
  level: VerificationLevel;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => VerificationDocumentDto)
  documents: VerificationDocumentDto[];

  @IsOptional()
  @IsString()
  notes?: string;
}
