import { IsString, IsOptional, IsObject, IsBoolean, IsArray } from 'class-validator'
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'

export class OrchestrateRequestDto {
  @IsString()
  @ApiProperty({ description: 'Action ID' })
  actionId: string

  @IsString()
  @ApiProperty({ description: 'Company ID' })
  companyId: string

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ description: 'User ID' })
  userId?: string

  @IsObject()
  @ApiProperty({ description: 'Request payload' })
  payload: Record<string, any>

  @IsOptional()
  @IsBoolean()
  @ApiPropertyOptional({ description: 'Whether to use cache' })
  useCache?: boolean
}

export class OrchestrateResponseDto {
  @ApiProperty({ description: 'Whether the orchestration succeeded' })
  success: boolean
  @ApiProperty({ description: 'Action ID' })
  actionId: string
  @ApiProperty({ description: 'Action name' })
  actionName: string
  @ApiProperty({ description: 'Action description' })
  actionDescription: string
  @ApiProperty({ description: 'Result data' })
  result: any
  @ApiProperty({ description: 'Latency in milliseconds' })
  latencyMs: number
  @ApiProperty({ description: 'Credit usage', nullable: true })
  credits: { required: number; remaining: number } | null
  @ApiProperty({ description: 'Whether result was cached' })
  cached: boolean
  @ApiProperty({ description: 'Whether result was from memory' })
  fromMemory: boolean
  @ApiProperty({ description: 'Whether result was from cache' })
  fromCache: boolean
  @ApiPropertyOptional({ description: 'Error message' })
  error?: string
}

export class WorkflowExecuteDto {
  @IsString()
  @ApiProperty({ description: 'Workflow ID' })
  workflowId: string

  @IsString()
  @ApiProperty({ description: 'Company ID' })
  companyId: string

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ description: 'User ID' })
  userId?: string

  @IsObject()
  @ApiProperty({ description: 'Workflow context' })
  context: Record<string, any>
}

export class ContextRequestDto {
  @IsString()
  @ApiProperty({ description: 'Company ID' })
  companyId: string

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ description: 'Product ID' })
  productId?: string

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ description: 'User ID' })
  userId?: string

  @IsArray()
  @IsString({ each: true })
  @ApiProperty({ description: 'Context sections to include' })
  include: string[]
}

export class AiDispatchEvent {
  @ApiProperty({ description: 'Action ID' })
  actionId: string
  @ApiProperty({ description: 'Action name' })
  actionName: string
  @ApiProperty({ description: 'Company ID' })
  companyId: string
  @ApiPropertyOptional({ description: 'User ID' })
  userId?: string
  @ApiProperty({ description: 'Whether the dispatch succeeded' })
  success: boolean
  @ApiProperty({ description: 'Latency in milliseconds' })
  latencyMs: number
  @ApiProperty({ description: 'Credit usage', nullable: true })
  credits: { required: number; remaining: number } | null
  @ApiProperty({ description: 'Whether result was cached' })
  cached: boolean
  @ApiProperty({ description: 'Whether result was from memory' })
  fromMemory: boolean
  @ApiPropertyOptional({ description: 'Error message' })
  error?: string
  @ApiProperty({ description: 'Event timestamp' })
  timestamp: Date
}

export interface WorkflowStep {
  actionId: string
  inputMapping?: Record<string, string>
  outputMapping?: Record<string, string>
  condition?: string
  timeout?: number
}

export interface WorkflowDefinition {
  id: string
  name: string
  description: string
  tags: string[]
  steps: WorkflowStep[]
}

export class WorkflowStepResult {
  @ApiProperty({ description: 'Step number' })
  step: number
  @ApiProperty({ description: 'Action ID' })
  actionId: string
  @ApiProperty({ description: 'Whether the step succeeded' })
  success: boolean
  @ApiProperty({ description: 'Step result data' })
  result: any
  @ApiProperty({ description: 'Step latency in milliseconds' })
  latencyMs: number
  @ApiPropertyOptional({ description: 'Error message' })
  error?: string
}

export class WorkflowExecuteResponseDto {
  @ApiProperty({ description: 'Whether the workflow succeeded' })
  success: boolean
  @ApiProperty({ description: 'Workflow ID' })
  workflowId: string
  @ApiProperty({ description: 'Workflow name' })
  workflowName: string
  @ApiProperty({ description: 'Steps completed' })
  stepsCompleted: number
  @ApiProperty({ description: 'Total steps' })
  totalSteps: number
  @ApiProperty({ description: 'Step results', type: [WorkflowStepResult] })
  results: WorkflowStepResult[]
  @ApiProperty({ description: 'Total latency in milliseconds' })
  totalLatencyMs: number
  @ApiProperty({ description: 'Final workflow context' })
  finalContext: Record<string, any>
  @ApiPropertyOptional({ description: 'Error message' })
  error?: string
}
