import { IsString, IsOptional, IsEnum, IsUUID, IsBoolean } from 'class-validator';
import { GOCASHWalletType } from '@prisma/client';

export class CreateWalletDto {
  @IsUUID()
  userId: string;

  @IsOptional()
  @IsString()
  companyId?: string;

  @IsEnum(GOCASHWalletType)
  type: GOCASHWalletType;

  @IsOptional()
  @IsBoolean()
  kycVerified?: boolean;
}
