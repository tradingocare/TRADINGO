import { IsString, IsNumber, IsOptional, IsEnum, IsUUID, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { GOCASHTransactionType } from '@prisma/client';

export class DebitWalletDto {
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  @ApiProperty({ description: 'Debit amount' })
  amount: number;

  @IsEnum(GOCASHTransactionType)
  @ApiProperty({ description: 'Transaction type', enum: GOCASHTransactionType })
  type: GOCASHTransactionType;

  @IsString()
  @ApiProperty({ description: 'Reason for debit' })
  reason: string;

  @IsOptional()
  @IsUUID()
  @ApiPropertyOptional({ description: 'Reference ID' })
  referenceId?: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ description: 'Reference type' })
  referenceType?: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ description: 'Source type' })
  sourceType?: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ description: 'Idempotency key for safe retries' })
  idempotencyKey?: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ description: 'Additional notes' })
  notes?: string;
}
