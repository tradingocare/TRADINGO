import { IsString, IsEmail, IsEnum, IsOptional, IsBoolean, MinLength, Matches, IsArray } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateVendorDto {
  @IsString()
  @ApiProperty({ description: 'Business name' })
  businessName: string;
  @IsOptional() @IsString()
  @ApiPropertyOptional({ description: 'Trade name' })
  tradeName?: string;
  @IsString()
  @ApiProperty({ description: 'Business type' })
  businessType: string;
  @IsString()
  @ApiProperty({ description: 'Seller type' })
  sellerType: string;
  @IsString()
  @ApiProperty({ description: 'Year established' })
  yearEstablished: string;
  @IsString()
  @ApiProperty({ description: 'Total employees' })
  totalEmployees: string;
  @IsString()
  @ApiProperty({ description: 'Annual turnover' })
  annualTurnover: string;
  @IsOptional() @IsString()
  @ApiPropertyOptional({ description: 'Website URL' })
  website?: string;

  @IsString()
  @ApiProperty({ description: 'Owner name' })
  ownerName: string;
  @IsString()
  @ApiProperty({ description: 'Designation' })
  designation: string;
  @IsEmail()
  @ApiProperty({ description: 'Email address' })
  email: string;
  @IsString() @Matches(/^[6-9]\d{9}$/)
  @ApiProperty({ description: 'Mobile number (10 digits)' })
  mobileNumber: string;
  @IsOptional() @IsString()
  @ApiPropertyOptional({ description: 'Alternate mobile number' })
  alternateMobile?: string;
  @IsString() @MinLength(8) @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{8,}$/, { message: 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character' })
  @ApiProperty({ description: 'Password (min 8 chars, must contain uppercase, lowercase, number, and special character)' })
  password: string;

  @IsString() @Matches(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/)
  @ApiProperty({ description: 'PAN number' })
  panNumber: string;
  @IsString()
  @ApiProperty({ description: 'PAN holder name' })
  panHolderName: string;
  @IsOptional() @IsString()
  @ApiPropertyOptional({ description: 'Date of birth' })
  dateOfBirth?: string;

  @IsBoolean()
  @ApiProperty({ description: 'Has GST registration' })
  hasGst: boolean;
  @IsOptional() @IsString()
  @ApiPropertyOptional({ description: 'GST number' })
  gstNumber?: string;
  @IsOptional() @IsString()
  @ApiPropertyOptional({ description: 'GST exemption reason' })
  gstExemptReason?: string;

  @IsString()
  @ApiProperty({ description: 'Business description' })
  description: string;
  @IsOptional() @IsString()
  @ApiPropertyOptional({ description: 'Business tagline' })
  tagline?: string;
  @IsString()
  @ApiProperty({ description: 'Primary category' })
  primaryCategory: string;
  @IsOptional() @IsArray()
  @ApiPropertyOptional({ description: 'Secondary categories' })
  secondaryCategories?: string[];
  @IsString()
  @ApiProperty({ description: 'Product types' })
  productTypes: string;
  @IsString()
  @ApiProperty({ description: 'MOQ range' })
  moqRange: string;
  @IsString()
  @ApiProperty({ description: 'Supply capacity' })
  supplyCapacity: string;
  @IsString()
  @ApiProperty({ description: 'Lead time' })
  leadTime: string;
  @IsBoolean()
  @ApiProperty({ description: 'Export capability' })
  exportCapability: boolean;
  @IsOptional() @IsString()
  @ApiPropertyOptional({ description: 'Export countries' })
  exportCountries?: string;
  @IsString()
  @ApiProperty({ description: 'Address line 1' })
  addressLine1: string;
  @IsOptional() @IsString()
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
  @IsString() @Matches(/^\d{6}$/)
  @ApiProperty({ description: 'Pincode (6 digits)' })
  pincode: string;

  @IsString()
  @ApiProperty({ description: 'Account holder name' })
  accountHolderName: string;
  @IsString()
  @ApiProperty({ description: 'Account number' })
  accountNumber: string;
  @IsString()
  @ApiProperty({ description: 'IFSC code' })
  ifscCode: string;
  @IsEnum(['current', 'savings'])
  @ApiProperty({ description: 'Account type (current or savings)' })
  accountType: string;

  @IsString()
  @ApiProperty({ description: 'Plan ID' })
  planId: string;
  @IsOptional() @IsString()
  @ApiPropertyOptional({ description: 'Referral code' })
  referralCode?: string;
  @IsOptional() @IsString()
  @ApiPropertyOptional({ description: 'RM code' })
  rmCode?: string;
}
