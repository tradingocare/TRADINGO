import { IsString, IsOptional, IsEnum, IsDateString } from 'class-validator';
import { CrmTaskType, CrmTaskStatus } from '@prisma/client';

export class CreateTaskDto {
  @IsEnum(CrmTaskType) type: CrmTaskType;
  @IsString() title: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsDateString() dueDate?: string;
  @IsOptional() @IsEnum(CrmTaskStatus) status?: CrmTaskStatus;
  @IsOptional() @IsString() assignedTo?: string;
}

export class UpdateTaskDto {
  @IsOptional() @IsEnum(CrmTaskType) type?: CrmTaskType;
  @IsOptional() @IsString() title?: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsDateString() dueDate?: string;
  @IsOptional() @IsEnum(CrmTaskStatus) status?: CrmTaskStatus;
  @IsOptional() @IsString() assignedTo?: string;
}
