import { IsString, IsOptional, IsBoolean } from 'class-validator';

export class CreateMediaDto {
  @IsString()
  url: string;

  @IsOptional()
  @IsString()
  type?: string;

  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  altText?: string;

  @IsOptional()
  @IsBoolean()
  isPrimary?: boolean;

  @IsOptional()
  @IsString()
  productId?: string;

  @IsOptional()
  @IsString()
  folderId?: string;
}
