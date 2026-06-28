import { IsString, IsEmail, IsOptional, IsBoolean, MinLength, Matches } from 'class-validator';

export class CreateBuyerDto {
  @IsString()
  fullName: string;

  @IsEmail()
  email: string;

  @IsString()
  @Matches(/^[6-9]\d{9}$/)
  mobileNumber: string;

  @IsOptional()
  @IsString()
  alternateMobile?: string;

  @IsString()
  @MinLength(8)
  password: string;

  @IsString()
  companyName: string;

  @IsString()
  designation: string;

  @IsString()
  businessType: string;

  @IsString()
  industry: string;

  @IsString()
  companySize: string;

  @IsString()
  annualProcurement: string;

  @IsOptional()
  @IsString()
  gstNumber?: string;

  @IsOptional()
  @IsString()
  website?: string;

  @IsString()
  addressLine1: string;

  @IsOptional()
  @IsString()
  addressLine2?: string;

  @IsString()
  city: string;

  @IsString()
  district: string;

  @IsString()
  state: string;

  @IsString()
  @Matches(/^\d{6}$/)
  pincode: string;

  @IsBoolean()
  primaryCategoriesRequired: boolean;

  @IsString()
  preferredSuppliers: string;

  @IsBoolean()
  notificationEmail: boolean;

  @IsBoolean()
  notificationSms: boolean;

  @IsBoolean()
  newsletter: boolean;
}
