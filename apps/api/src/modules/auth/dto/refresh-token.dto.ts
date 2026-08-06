import { IsOptional, IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RefreshTokenDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @ApiProperty({ description: 'Refresh token', required: false })
  refreshToken?: string;
}