import { IsString, IsOptional, IsEnum, IsObject, IsArray } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { MarketingWorkflowTrigger, MarketingWorkflowStatus } from '@prisma/client';

export class CreateWorkflowDto {
  @IsString()
  @ApiProperty({ description: 'Workflow name' })
  name: string;

  @IsOptional() @IsString()
  @ApiPropertyOptional({ description: 'Workflow description' })
  description?: string;

  @IsEnum(MarketingWorkflowTrigger)
  @ApiProperty({ description: 'Trigger event', enum: MarketingWorkflowTrigger })
  trigger: MarketingWorkflowTrigger;

  @IsOptional() @IsObject()
  @ApiPropertyOptional({ description: 'Conditions to evaluate' })
  conditions?: Record<string, unknown>;

  @IsArray()
  @ApiProperty({ description: 'Actions to execute (array of action objects)' })
  actions: Record<string, unknown>[];
}

export class UpdateWorkflowDto {
  @IsOptional() @IsString()
  @ApiPropertyOptional({ description: 'Workflow name' })
  name?: string;

  @IsOptional() @IsString()
  @ApiPropertyOptional({ description: 'Workflow description' })
  description?: string;

  @IsOptional() @IsEnum(MarketingWorkflowTrigger)
  @ApiPropertyOptional({ description: 'Trigger event', enum: MarketingWorkflowTrigger })
  trigger?: MarketingWorkflowTrigger;

  @IsOptional() @IsEnum(MarketingWorkflowStatus)
  @ApiPropertyOptional({ description: 'Workflow status', enum: MarketingWorkflowStatus })
  status?: MarketingWorkflowStatus;

  @IsOptional() @IsObject()
  @ApiPropertyOptional({ description: 'Conditions to evaluate' })
  conditions?: Record<string, unknown>;

  @IsOptional() @IsArray()
  @ApiPropertyOptional({ description: 'Actions to execute' })
  actions?: Record<string, unknown>[];
}

export class WorkflowQueryDto {
  @IsOptional() @IsEnum(MarketingWorkflowTrigger)
  @ApiPropertyOptional({ description: 'Filter by trigger' })
  trigger?: MarketingWorkflowTrigger;

  @IsOptional() @IsEnum(MarketingWorkflowStatus)
  @ApiPropertyOptional({ description: 'Filter by status' })
  status?: MarketingWorkflowStatus;

  @IsOptional()
  page?: number;

  @IsOptional()
  limit?: number;
}
