import { PartialType, OmitType } from '@nestjs/swagger';
import { IsOptional, IsString, IsNumber, IsArray, IsDateString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class PoLineItemDto {
  @IsString()                       productName: string;
  @IsOptional() @IsString()         description?: string;
  @IsOptional() @IsNumber()         quantity?: number;
  @IsOptional() @IsString()         unit?: string;
  @IsNumber()                       unitPrice: number;
  @IsOptional() @IsNumber()         totalPrice?: number;
  @IsOptional() @IsNumber()         gstRate?: number;
  @IsOptional() @IsNumber()         gstAmount?: number;
  @IsOptional() @IsString()         deliveryTerms?: string;
  @IsOptional() @IsNumber()         leadTimeDays?: number;
  @IsOptional() @IsString()         notes?: string;
}

export class UpdatePoDto {
  @IsOptional() @IsString()         currency?: string;
  @IsOptional() @IsNumber()         subtotal?: number;
  @IsOptional() @IsNumber()         taxAmount?: number;
  @IsOptional() @IsNumber()         totalAmount?: number;
  @IsOptional() @IsNumber()         discountAmount?: number;
  @IsOptional() @IsNumber()         discountPercent?: number;
  @IsOptional() @IsString()         deliveryTerms?: string;
  @IsOptional() @IsString()         paymentTerms?: string;
  @IsOptional() @IsNumber()         leadTimeDays?: number;
  @IsOptional() @IsString()         leadTimeDisplay?: string;
  @IsOptional() @IsDateString()     validityDate?: string;
  @IsOptional() @IsString()         warranty?: string;
  @IsOptional() @IsString()         freight?: string;
  @IsOptional() @IsString()         packing?: string;
  @IsOptional() @IsString()         specialConditions?: string;
  @IsOptional() @IsString()         commercialNotes?: string;
  @IsOptional() @IsString()         gstType?: string;
  @IsOptional() @IsNumber()         gstRate?: number;
  @IsOptional() @IsArray() @ValidateNested({ each: true }) @Type(() => PoLineItemDto)
  lineItems?: PoLineItemDto[];
  @IsOptional() @IsString()         revisionNotes?: string;
}
