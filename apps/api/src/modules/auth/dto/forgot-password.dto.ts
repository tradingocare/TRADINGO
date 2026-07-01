import { IsString, IsOptional, IsBoolean, MinLength } from 'class-validator';

export class ForgotPasswordDto {
  @IsString()
  identifier: string;
}

export class VerifyResetOtpDto {
  @IsString()
  identifier: string;

  @IsString()
  otp: string;
}

export class ResetPasswordDto {
  @IsString()
  resetToken: string;

  @IsString()
  @MinLength(8)
  newPassword: string;
}

export class SendOtpDto {
  @IsString()
  type: 'mobile' | 'email';

  @IsString()
  value: string;
}

export class VerifyOtpDto {
  @IsString()
  type: 'mobile' | 'email';

  @IsString()
  value: string;

  @IsString()
  otp: string;
}

export class LoginOtpDto {
  @IsString()
  identifier: string;

  @IsString()
  otp: string;

  @IsOptional()
  @IsBoolean()
  rememberMe?: boolean;
}

export class VerifyEmailDto {
  @IsString()
  token: string;
}

export class ResendVerificationDto {
  @IsString()
  email: string;
}
