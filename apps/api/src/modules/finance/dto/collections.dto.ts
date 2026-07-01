import { IsString, IsOptional, IsNumber, IsEnum, IsDateString, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { CollectionActionType } from '@prisma/client';

export class CreateCollectionNoteDto {
  @IsEnum(CollectionActionType) actionType: CollectionActionType;
  @IsString() content: string;
  @IsOptional() @IsString() contactedPerson?: string;
  @IsOptional() @IsString() outcome?: string;
  @IsOptional() @IsDateString() followUpAt?: string;
}

export class UpdateCollectionNoteDto {
  @IsOptional() @IsString() content?: string;
  @IsOptional() @IsString() outcome?: string;
  @IsOptional() @IsDateString() followUpAt?: string;
}

export class QueryCollectionsDto {
  @IsOptional() @IsString() search?: string;
  @IsOptional() @IsNumber() @Type(() => Number) minOverdueDays?: number;
  @IsOptional() @IsNumber() @Type(() => Number) maxOverdueDays?: number;
  @IsOptional() @IsNumber() @Type(() => Number) minAmount?: number;
  @IsOptional() @IsNumber() @Type(() => Number) page?: number;
  @IsOptional() @IsNumber() @Type(() => Number) limit?: number;
}
