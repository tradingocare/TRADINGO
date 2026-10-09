import { IsInt, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ProductPricingQueryDto {
  @IsInt()
  @Min(1)
  @ApiProperty({
    description: 'Requested purchase quantity (positive integer). The authoritative unit price and subtotal are resolved server-side from the product price slabs for this quantity.',
    minimum: 1,
    example: 60,
  })
  qty: number;
}
