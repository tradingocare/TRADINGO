import { IsNumber, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class FundAdvertisingDto {
  @IsNumber()
  @Min(1)
  @Type(() => Number)
  @ApiProperty({ description: 'Funding amount' })
  amount: number;
}
