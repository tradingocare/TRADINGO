import { IsEmail, IsString, MinLength, Matches, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class RegisterDto {
  @IsEmail()
  @ApiProperty({ description: 'User email address' })
  email: string;

  @IsString()
  @MinLength(8)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^a-zA-Z\d])/, {
    message: 'Password must contain uppercase, lowercase, number, and special character',
  })
  @ApiProperty({ description: 'User password' })
  password: string;

  @IsString()
  @MinLength(1)
  @ApiProperty({ description: 'User display name' })
  name: string;

  @IsOptional()
  @IsString()
  @Matches(/^[6-9]\d{9}$/, { message: 'Mobile must be a valid 10-digit Indian mobile number' })
  @ApiPropertyOptional({ description: 'Mobile number (10 digits, optional)' })
  mobile?: string;
}
