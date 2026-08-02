import { IsString, IsEnum, IsOptional, IsArray, ValidateNested } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { VerificationLevel, DocumentType } from '@prisma/client';

class VerificationDocumentDto {
  @IsEnum(DocumentType)
  @ApiProperty({ description: 'Document type', enum: DocumentType })
  documentType: DocumentType;

  @IsString()
  @ApiProperty({ description: 'Document URL' })
  documentUrl: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ description: 'Additional notes' })
  notes?: string;
}

export class SubmitVerificationDto {
  @IsString()
  @ApiProperty({ description: 'Company ID' })
  companyId: string;

  @IsEnum(VerificationLevel)
  @ApiProperty({ description: 'Verification level', enum: VerificationLevel })
  level: VerificationLevel;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => VerificationDocumentDto)
  @ApiProperty({ description: 'Verification documents', type: [VerificationDocumentDto] })
  documents: VerificationDocumentDto[];

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ description: 'Additional notes' })
  notes?: string;
}
