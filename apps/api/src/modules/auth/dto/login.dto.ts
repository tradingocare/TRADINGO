import { IsString, IsOptional, IsBoolean } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class LoginDto {
  @IsString()
  @ApiProperty({ description: 'Email, mobile number, or PAN' })
  identifier: string;

  @IsString()
  @ApiProperty({ description: 'User password' })
  password: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ description: 'Login role (buyer, vendor, admin)' })
  role?: string;

  @IsOptional()
  @IsBoolean()
  @ApiPropertyOptional({ description: 'Remember me flag' })
  rememberMe?: boolean;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ description: 'Turnstile token for bot protection' })
  turnstileToken?: string;
}
