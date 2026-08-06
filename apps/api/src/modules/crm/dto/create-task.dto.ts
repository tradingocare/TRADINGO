import { IsString, IsOptional, IsEnum, IsDateString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CrmTaskType, CrmTaskStatus } from '@prisma/client';

export class CreateTaskDto {
  @IsEnum(CrmTaskType)
  @ApiProperty({ description: 'Task type', enum: CrmTaskType })
  type: CrmTaskType;
  @IsString()
  @ApiProperty({ description: 'Task title' })
  title: string;
  @IsOptional() @IsString()
  @ApiPropertyOptional({ description: 'Task description' })
  description?: string;
  @IsOptional() @IsDateString()
  @ApiPropertyOptional({ description: 'Due date (ISO 8601)' })
  dueDate?: string;
  @IsOptional() @IsEnum(CrmTaskStatus)
  @ApiPropertyOptional({ description: 'Task status', enum: CrmTaskStatus })
  status?: CrmTaskStatus;
  @IsOptional() @IsString()
  @ApiPropertyOptional({ description: 'Assigned user ID' })
  assignedTo?: string;
}

export class UpdateTaskDto {
  @IsOptional() @IsEnum(CrmTaskType)
  @ApiPropertyOptional({ description: 'Task type', enum: CrmTaskType })
  type?: CrmTaskType;
  @IsOptional() @IsString()
  @ApiPropertyOptional({ description: 'Task title' })
  title?: string;
  @IsOptional() @IsString()
  @ApiPropertyOptional({ description: 'Task description' })
  description?: string;
  @IsOptional() @IsDateString()
  @ApiPropertyOptional({ description: 'Due date (ISO 8601)' })
  dueDate?: string;
  @IsOptional() @IsEnum(CrmTaskStatus)
  @ApiPropertyOptional({ description: 'Task status', enum: CrmTaskStatus })
  status?: CrmTaskStatus;
  @IsOptional() @IsString()
  @ApiPropertyOptional({ description: 'Assigned user ID' })
  assignedTo?: string;
}
