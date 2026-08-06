import { IsString, IsOptional, IsNumber, IsEnum, IsArray, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CreditNoteStatus, DebitNoteStatus } from '@prisma/client';

class NoteItemDto {
  @IsString()
  @ApiProperty({ description: 'Item description' })
  description: string;
  @IsOptional() @IsString()
  @ApiPropertyOptional({ description: 'HSN/SAC code' })
  hsnSacCode?: string;
  @IsOptional() @IsNumber() @Type(() => Number)
  @ApiPropertyOptional({ description: 'Quantity' })
  quantity?: number;
  @IsNumber() @Type(() => Number)
  @ApiProperty({ description: 'Unit price' })
  unitPrice: number;
  @IsNumber() @Type(() => Number)
  @ApiProperty({ description: 'Amount' })
  amount: number;
}

export class CreateCreditNoteDto {
  @IsString()
  @ApiProperty({ description: 'Invoice ID' })
  invoiceId: string;
  @IsString()
  @ApiProperty({ description: 'Credit note reason' })
  reason: string;
  @IsNumber() @Min(0) @Type(() => Number)
  @ApiProperty({ description: 'Subtotal amount' })
  subtotal: number;
  @IsOptional() @IsNumber() @Min(0) @Type(() => Number)
  @ApiPropertyOptional({ description: 'Tax amount' })
  taxAmount?: number;
  @IsNumber() @Min(0) @Type(() => Number)
  @ApiProperty({ description: 'Total amount' })
  totalAmount: number;
  @IsOptional() @IsString()
  @ApiPropertyOptional({ description: 'Additional notes' })
  notes?: string;
  @IsOptional() @IsArray()
  @ApiPropertyOptional({ description: 'Note items', type: [NoteItemDto] })
  items?: NoteItemDto[];
}

export class CreateDebitNoteDto {
  @IsString()
  @ApiProperty({ description: 'Invoice ID' })
  invoiceId: string;
  @IsString()
  @ApiProperty({ description: 'Debit note reason' })
  reason: string;
  @IsNumber() @Min(0) @Type(() => Number)
  @ApiProperty({ description: 'Subtotal amount' })
  subtotal: number;
  @IsOptional() @IsNumber() @Min(0) @Type(() => Number)
  @ApiPropertyOptional({ description: 'Tax amount' })
  taxAmount?: number;
  @IsNumber() @Min(0) @Type(() => Number)
  @ApiProperty({ description: 'Total amount' })
  totalAmount: number;
  @IsOptional() @IsString()
  @ApiPropertyOptional({ description: 'Additional notes' })
  notes?: string;
  @IsOptional() @IsArray()
  @ApiPropertyOptional({ description: 'Note items', type: [NoteItemDto] })
  items?: NoteItemDto[];
}

export class UpdateNoteStatusDto {
  @IsEnum([CreditNoteStatus, DebitNoteStatus])
  @ApiProperty({ description: 'Note status' })
  status: CreditNoteStatus | DebitNoteStatus;
  @IsOptional() @IsString()
  @ApiPropertyOptional({ description: 'Status change reason' })
  reason?: string;
}

export class QueryNoteDto {
  @IsOptional() @IsString()
  @ApiPropertyOptional({ description: 'Search query' })
  search?: string;
  @IsOptional() @IsString()
  @ApiPropertyOptional({ description: 'Invoice ID' })
  invoiceId?: string;
  @IsOptional() @IsString()
  @ApiPropertyOptional({ description: 'Company ID' })
  companyId?: string;
  @IsOptional() @IsString()
  @ApiPropertyOptional({ description: 'Filter by status' })
  status?: string;
  @IsOptional() @IsNumber() @Type(() => Number)
  @ApiPropertyOptional({ description: 'Page number' })
  page?: number;
  @IsOptional() @IsNumber() @Type(() => Number)
  @ApiPropertyOptional({ description: 'Items per page' })
  limit?: number;
}
