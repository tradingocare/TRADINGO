import { IsNumber, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class FundAdvertisingDto {
  @IsNumber()
  @Min(1)
  @Type(() => Number)
  amount: number;
}
