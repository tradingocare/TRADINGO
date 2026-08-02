import { IsString, IsEmail, IsOptional, IsBoolean, MinLength, Matches } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateBuyerDto {
  @IsString()
  @ApiProperty({ description: 'Full name' })
  fullName: string;

  @IsEmail()
  @ApiProperty({ description: 'Email address' })
  email: string;

  @IsString()
  @Matches(/^[6-9]\d{9}$/)
  @ApiProperty({ description: 'Mobile number (10 digits)' })
  mobileNumber: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ description: 'Alternate mobile number' })
  alternateMobile?: string;

  @IsString()
  @MinLength(8)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{8,}$/, { message: 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character' })
  @ApiProperty({ description: 'Password (min 8 chars, must contain uppercase, lowercase, number, and special character)' })
  password: string;

  @IsString()
  @ApiProperty({ description: 'Company name' })
  companyName: string;

  @IsString()
  @ApiProperty({ description: 'Designation' })
  designation: string;

  @IsString()
  @ApiProperty({ description: 'Business type' })
  businessType: string;

  @IsString()
  @ApiProperty({ description: 'Industry' })
  industry: string;

  @IsString()
  @ApiProperty({ description: 'Company size' })
  companySize: string;

  @IsString()
  @ApiProperty({ description: 'Annual procurement' })
  annualProcurement: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ description: 'GST number' })
  gstNumber?: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ description: 'Website URL' })
  website?: string;

  @IsString()
  @ApiProperty({ description: 'Address line 1' })
  addressLine1: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ description: 'Address line 2' })
  addressLine2?: string;

  @IsString()
  @ApiProperty({ description: 'City' })
  city: string;

  @IsString()
  @ApiProperty({ description: 'District' })
  district: string;

  @IsString()
  @ApiProperty({ description: 'State' })
  state: string;

  @IsString()
  @Matches(/^\d{6}$/)
  @ApiProperty({ description: 'Pincode (6 digits)' })
  pincode: string;

  @IsBoolean()
  @ApiProperty({ description: 'Primary categories required' })
  primaryCategoriesRequired: boolean;

  @IsString()
  @ApiProperty({ description: 'Preferred suppliers' })
  preferredSuppliers: string;

  @IsBoolean()
  @ApiProperty({ description: 'Email notifications enabled' })
  notificationEmail: boolean;

  @IsBoolean()
  @ApiProperty({ description: 'SMS notifications enabled' })
  notificationSms: boolean;

  @IsBoolean()
  @ApiProperty({ description: 'Newsletter subscription' })
  newsletter: boolean;
}
