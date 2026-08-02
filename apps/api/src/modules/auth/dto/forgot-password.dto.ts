import { IsString, IsOptional, IsBoolean, MinLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ForgotPasswordDto {
  @IsString()
  @ApiProperty({ description: 'Email or mobile number' })
  identifier: string;
}

export class VerifyResetOtpDto {
  @IsString()
  @ApiProperty({ description: 'Email or mobile number' })
  identifier: string;

  @IsString()
  @ApiProperty({ description: 'OTP code' })
  otp: string;
}

export class ResetPasswordDto {
  @IsString()
  @ApiProperty({ description: 'Reset token' })
  resetToken: string;

  @IsString()
  @MinLength(8)
  @ApiProperty({ description: 'New password (min 8 chars)' })
  newPassword: string;
}

export class SendOtpDto {
  @IsString()
  @ApiProperty({ description: 'Type of OTP delivery (mobile or email)' })
  type: 'mobile' | 'email';

  @IsString()
  @ApiProperty({ description: 'Mobile number or email address' })
  value: string;
}

export class VerifyOtpDto {
  @IsString()
  @ApiProperty({ description: 'Type of OTP delivery (mobile or email)' })
  type: 'mobile' | 'email';

  @IsString()
  @ApiProperty({ description: 'Mobile number or email address' })
  value: string;

  @IsString()
  @ApiProperty({ description: 'OTP code' })
  otp: string;
}

export class LoginOtpDto {
  @IsString()
  @ApiProperty({ description: 'Email or mobile number' })
  identifier: string;

  @IsString()
  @ApiProperty({ description: 'OTP code' })
  otp: string;

  @IsOptional()
  @IsBoolean()
  @ApiPropertyOptional({ description: 'Remember me flag' })
  rememberMe?: boolean;
}

export class VerifyEmailDto {
  @IsString()
  @ApiProperty({ description: 'Email verification token' })
  token: string;
}

export class ResendVerificationDto {
  @IsString()
  @ApiProperty({ description: 'Email address' })
  email: string;
}
