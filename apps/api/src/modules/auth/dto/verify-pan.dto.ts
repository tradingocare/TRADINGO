import { IsString, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class VerifyPanDto {
  @IsString()
  @Matches(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/)
  @ApiProperty({ description: 'PAN number (10 characters)' })
  panNumber: string;
}
