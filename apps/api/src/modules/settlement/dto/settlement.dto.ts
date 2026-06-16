import { IsOptional, IsEnum, IsInt, Min, IsUUID } from 'class-validator';
import { SettlementStatus } from '@prisma/client';

export class CreateSettlementDto {
  @IsUUID()
  escrowId: string;
}

export class QuerySettlementDto {
  @IsOptional()
  @IsEnum(SettlementStatus)
  status?: SettlementStatus;

  @IsOptional()
  @IsInt()
  @Min(0)
  skip?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  take?: number;
}
