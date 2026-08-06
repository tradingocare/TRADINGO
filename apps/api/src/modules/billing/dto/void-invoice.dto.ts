import { IsString, IsNotEmpty } from 'class-validator';

export class VoidInvoiceDto {
  @IsString()
  @IsNotEmpty()
  reason: string;
}
