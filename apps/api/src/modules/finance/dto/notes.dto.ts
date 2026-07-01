import { IsString, IsOptional, IsNumber, IsEnum, IsArray, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { CreditNoteStatus, DebitNoteStatus } from '@prisma/client';

class NoteItemDto {
  @IsString() description: string;
  @IsOptional() @IsString() hsnSacCode?: string;
  @IsOptional() @IsNumber() @Type(() => Number) quantity?: number;
  @IsNumber() @Type(() => Number) unitPrice: number;
  @IsNumber() @Type(() => Number) amount: number;
}

export class CreateCreditNoteDto {
  @IsString() invoiceId: string;
  @IsString() reason: string;
  @IsNumber() @Min(0) @Type(() => Number) subtotal: number;
  @IsOptional() @IsNumber() @Min(0) @Type(() => Number) taxAmount?: number;
  @IsNumber() @Min(0) @Type(() => Number) totalAmount: number;
  @IsOptional() @IsString() notes?: string;
  @IsOptional() @IsArray() items?: NoteItemDto[];
}

export class CreateDebitNoteDto {
  @IsString() invoiceId: string;
  @IsString() reason: string;
  @IsNumber() @Min(0) @Type(() => Number) subtotal: number;
  @IsOptional() @IsNumber() @Min(0) @Type(() => Number) taxAmount?: number;
  @IsNumber() @Min(0) @Type(() => Number) totalAmount: number;
  @IsOptional() @IsString() notes?: string;
  @IsOptional() @IsArray() items?: NoteItemDto[];
}

export class UpdateNoteStatusDto {
  @IsEnum([CreditNoteStatus, DebitNoteStatus]) status: CreditNoteStatus | DebitNoteStatus;
  @IsOptional() @IsString() reason?: string;
}

export class QueryNoteDto {
  @IsOptional() @IsString() search?: string;
  @IsOptional() @IsString() invoiceId?: string;
  @IsOptional() @IsString() companyId?: string;
  @IsOptional() @IsString() status?: string;
  @IsOptional() @IsNumber() @Type(() => Number) page?: number;
  @IsOptional() @IsNumber() @Type(() => Number) limit?: number;
}
