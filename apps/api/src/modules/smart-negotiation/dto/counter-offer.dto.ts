import { IsOptional, IsString, IsNumber, IsDateString } from 'class-validator';

export class CounterOfferDto {
  @IsOptional() @IsNumber()       proposedPrice?: number;
  @IsOptional() @IsNumber()       proposedMoq?: number;
  @IsOptional() @IsNumber()       proposedLeadTimeDays?: number;
  @IsOptional() @IsString()       proposedDeliveryTerms?: string;
  @IsOptional() @IsString()       proposedPaymentTerms?: string;
  @IsOptional() @IsNumber()       proposedDiscountPercent?: number;
  @IsOptional() @IsString()       proposedWarranty?: string;
  @IsOptional() @IsString()       proposedFreight?: string;
  @IsOptional() @IsDateString()   proposedValidityDate?: string;
  @IsOptional() @IsString()       notes?: string;
}
