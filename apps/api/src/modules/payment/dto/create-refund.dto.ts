import { IsInt, IsOptional, IsString, IsUUID, Min } from 'class-validator';

export class CreateRefundDto {
  @IsInt()
  @Min(1)
  amount: number;

  @IsOptional()
  @IsString()
  reason?: string;

  @IsOptional()
  @IsUUID()
  orderReturnId?: string;
}
