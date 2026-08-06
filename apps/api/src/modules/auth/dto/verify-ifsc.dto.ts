import { IsString, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class VerifyIfscDto {
  @IsString()
  @Matches(/^[A-Z]{4}0[A-Z0-9]{6}$/)
  @ApiProperty({ description: 'IFSC code (11 characters)' })
  ifscCode: string;
}
