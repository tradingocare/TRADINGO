import { IsString, IsOptional, IsDateString, IsEnum } from 'class-validator';
import { CrmFollowUpStatus } from '@prisma/client';

export class CreateFollowUpDto {
  @IsString() title: string;
  @IsOptional() @IsString() description?: string;
  @IsDateString() dueDate: string;
  @IsOptional() @IsEnum(CrmFollowUpStatus) status?: CrmFollowUpStatus;
  @IsOptional() @IsString() assignedTo?: string;
}

export class UpdateFollowUpDto {
  @IsOptional() @IsString() title?: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsDateString() dueDate?: string;
  @IsOptional() @IsEnum(CrmFollowUpStatus) status?: CrmFollowUpStatus;
  @IsOptional() @IsString() assignedTo?: string;
}
