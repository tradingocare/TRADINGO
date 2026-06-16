import { IsString, IsOptional, IsArray, IsNumber, IsDateString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateQuoteLineItemDto {
  @IsOptional()
  @IsString()
  rfqProductItemId?: string;

  @IsString()
  productName: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsNumber()
  quantity?: number;

  @IsOptional()
  @IsString()
  unit?: string;

  @IsNumber()
  unitPrice: number;

  @IsOptional()
  @IsString()
  deliveryTerms?: string;

  @IsOptional()
  @IsNumber()
  leadTimeDays?: number;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class CreateQuoteAttachmentDto {
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
}

export class CreateQuoteDto {
  @IsOptional()
  @IsString()
  currency?: string;

  @IsOptional()
  @IsNumber()
  subtotal?: number;

  @IsOptional()
  @IsNumber()
  taxAmount?: number;

  @IsOptional()
  @IsNumber()
  totalAmount?: number;

  @IsOptional()
  @IsNumber()
  discountAmount?: number;

  @IsOptional()
  @IsNumber()
  discountPercent?: number;

  @IsOptional()
  @IsString()
  deliveryTerms?: string;

  @IsOptional()
  @IsString()
  paymentTerms?: string;

  @IsOptional()
  @IsNumber()
  leadTimeDays?: number;

  @IsOptional()
  @IsString()
  leadTimeDisplay?: string;

  @IsOptional()
  @IsDateString()
  validityDate?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateQuoteLineItemDto)
  lineItems?: CreateQuoteLineItemDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateQuoteAttachmentDto)
  attachments?: CreateQuoteAttachmentDto[];
}
