import { IsString, IsOptional, IsEnum, IsUUID, IsBoolean } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { GOCASHWalletType } from '@prisma/client';

export class CreateWalletDto {
  @IsUUID()
  @ApiProperty({ description: 'User ID' })
  userId: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ description: 'Company ID' })
  companyId?: string;

  @IsEnum(GOCASHWalletType)
  @ApiProperty({ description: 'Wallet type', enum: GOCASHWalletType })
  type: GOCASHWalletType;

  @IsOptional()
  @IsBoolean()
  @ApiPropertyOptional({ description: 'KYC verified flag' })
  kycVerified?: boolean;
}
