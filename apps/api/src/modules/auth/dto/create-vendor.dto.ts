import { IsString, IsEmail, IsEnum, IsOptional, IsBoolean, MinLength, Matches, IsArray } from 'class-validator';

export class CreateVendorDto {
  @IsString() businessName: string;
  @IsOptional() @IsString() tradeName?: string;
  @IsString() businessType: string;
  @IsString() sellerType: string;
  @IsString() yearEstablished: string;
  @IsString() totalEmployees: string;
  @IsString() annualTurnover: string;
  @IsOptional() @IsString() website?: string;

  @IsString() ownerName: string;
  @IsString() designation: string;
  @IsEmail() email: string;
  @IsString() @Matches(/^[6-9]\d{9}$/) mobileNumber: string;
  @IsOptional() @IsString() alternateMobile?: string;
  @IsString() @MinLength(8) password: string;

  @IsString() @Matches(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/) panNumber: string;
  @IsString() panHolderName: string;
  @IsOptional() @IsString() dateOfBirth?: string;

  @IsBoolean() hasGst: boolean;
  @IsOptional() @IsString() gstNumber?: string;
  @IsOptional() @IsString() gstExemptReason?: string;

  @IsString() description: string;
  @IsOptional() @IsString() tagline?: string;
  @IsString() primaryCategory: string;
  @IsOptional() @IsArray() secondaryCategories?: string[];
  @IsString() productTypes: string;
  @IsString() moqRange: string;
  @IsString() supplyCapacity: string;
  @IsString() leadTime: string;
  @IsBoolean() exportCapability: boolean;
  @IsOptional() @IsString() exportCountries?: string;
  @IsString() addressLine1: string;
  @IsOptional() @IsString() addressLine2?: string;
  @IsString() city: string;
  @IsString() district: string;
  @IsString() state: string;
  @IsString() @Matches(/^\d{6}$/) pincode: string;

  @IsString() accountHolderName: string;
  @IsString() accountNumber: string;
  @IsString() ifscCode: string;
  @IsEnum(['current', 'savings']) accountType: string;

  @IsString() planId: string;
  @IsOptional() @IsString() referralCode?: string;
  @IsOptional() @IsString() rmCode?: string;
}
