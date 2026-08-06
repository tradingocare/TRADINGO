import { IsString, IsOptional, IsObject, IsNumber, IsArray, IsEnum, Min, Max } from 'class-validator'
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { TaskType } from '@prisma/client'

export enum AiTaskPriority {
  CRITICAL = 1,
  HIGH = 2,
  MEDIUM = 3,
  LOW = 4,
  BACKGROUND = 5,
}

export enum AiTaskStatus {
  QUEUED = 'QUEUED',
  RUNNING = 'RUNNING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  TIMEOUT = 'TIMEOUT',
  CANCELLED = 'CANCELLED',
}

export enum AiTaskType {
  BULK_PROCESS = 'BULK_PROCESS',
  SINGLE_INFERENCE = 'SINGLE_INFERENCE',
  WORKFLOW = 'WORKFLOW',
  PARALLEL_BATCH = 'PARALLEL_BATCH',
}

export class EnqueueTaskDto {
  @IsString()
  @ApiProperty({ description: 'Task type', enum: AiTaskType })
  taskType: AiTaskType

  @IsString()
  @ApiProperty({ description: 'Company ID' })
  companyId: string

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ description: 'User ID' })
  userId?: string

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ description: 'Action ID' })
  actionId?: string

  @IsOptional()
  @IsObject()
  @ApiPropertyOptional({ description: 'Task payload' })
  payload?: Record<string, unknown>

  @IsOptional()
  @IsEnum(TaskType)
  @ApiPropertyOptional({ description: 'Gateway task type', enum: TaskType })
  gatewayTaskType?: TaskType

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(5)
  @ApiPropertyOptional({ description: 'Priority (1=highest, 5=lowest)' })
  priority?: number

  @IsOptional()
  @IsNumber()
  @Min(1000)
  @ApiPropertyOptional({ description: 'Timeout in milliseconds' })
  timeoutMs?: number

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(10)
  @ApiPropertyOptional({ description: 'Max retries (0-10)' })
  maxRetries?: number

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ description: 'Workflow ID' })
  workflowId?: string

  @IsOptional()
  @IsNumber()
  @ApiPropertyOptional({ description: 'Parent task ID' })
  parentTaskId?: number

  @IsOptional()
  @IsString({ each: true })
  @IsArray()
  @ApiPropertyOptional({ description: 'Task dependencies' })
  dependsOn?: string[]
}

export class DispatchActionDto {
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
  @ApiProperty({ description: 'Action payload' })
  payload: Record<string, unknown>

  @IsOptional()
  @IsEnum(AiTaskPriority)
  @ApiPropertyOptional({ description: 'Task priority', enum: AiTaskPriority })
  priority?: AiTaskPriority

  @IsOptional()
  @IsNumber()
  @ApiPropertyOptional({ description: 'Timeout in milliseconds' })
  timeoutMs?: number
}

export class ExecuteWorkflowDto {
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
  context: Record<string, unknown>

  @IsOptional()
  @IsEnum(AiTaskPriority)
  @ApiPropertyOptional({ description: 'Task priority', enum: AiTaskPriority })
  priority?: AiTaskPriority
}

export class ParallelBatchDto {
  @IsString()
  @ApiProperty({ description: 'Company ID' })
  companyId: string

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ description: 'User ID' })
  userId?: string

  @IsArray()
  @ApiProperty({ description: 'Array of actions to execute in parallel' })
  actions: { actionId: string; payload: Record<string, unknown>; priority?: AiTaskPriority; timeoutMs?: number }[]

  @IsOptional()
  @IsEnum(AiTaskPriority)
  @ApiPropertyOptional({ description: 'Task priority', enum: AiTaskPriority })
  priority?: AiTaskPriority
}

export class CircuitBreakerConfigDto {
  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ description: 'Action ID to monitor' })
  actionId?: string

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ description: 'Provider name to monitor' })
  providerName?: string

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  @ApiPropertyOptional({ description: 'Failure rate threshold (0.0-1.0) before opening circuit' })
  failureRateThreshold?: number

  @IsOptional()
  @IsNumber()
  @Min(1)
  @ApiPropertyOptional({ description: 'Minimum failures before circuit may open' })
  minimumFailures?: number

  @IsOptional()
  @IsNumber()
  @Min(1000)
  @ApiPropertyOptional({ description: 'Recovery timeout in milliseconds' })
  recoveryTimeoutMs?: number

  @IsOptional()
  @IsNumber()
  @Min(1)
  @ApiPropertyOptional({ description: 'Max requests in half-open state' })
  halfOpenMaxRequests?: number
}

export class SlaConfigDto {
  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ description: 'Action ID to monitor' })
  actionId?: string

  @IsOptional()
  @IsNumber()
  @Min(1)
  @ApiPropertyOptional({ description: 'P50 target in milliseconds' })
  p50TargetMs?: number

  @IsOptional()
  @IsNumber()
  @Min(1)
  @ApiPropertyOptional({ description: 'P95 target in milliseconds' })
  p95TargetMs?: number

  @IsOptional()
  @IsNumber()
  @Min(1)
  @ApiPropertyOptional({ description: 'P99 target in milliseconds' })
  p99TargetMs?: number

  @IsOptional()
  @IsNumber()
  @Min(1)
  @ApiPropertyOptional({ description: 'Alert threshold in milliseconds' })
  alertThresholdMs?: number
}

export class AiTaskInfo {
  @ApiProperty({ description: 'Task ID' })
  id: string
  @ApiPropertyOptional({ description: 'Job ID' })
  jobId?: string
  @ApiProperty({ description: 'Task type', enum: AiTaskType })
  type: AiTaskType
  @ApiProperty({ description: 'Task status', enum: AiTaskStatus })
  status: AiTaskStatus
  @ApiProperty({ description: 'Company ID' })
  companyId: string
  @ApiPropertyOptional({ description: 'User ID' })
  userId?: string
  @ApiPropertyOptional({ description: 'Action ID' })
  actionId?: string
  @ApiProperty({ description: 'Task priority' })
  priority: number
  @ApiProperty({ description: 'Progress percentage' })
  progress: number
  @ApiProperty({ description: 'Creation timestamp' })
  createdAt: string
  @ApiPropertyOptional({ description: 'Start timestamp' })
  startedAt?: string
  @ApiPropertyOptional({ description: 'Completion timestamp' })
  completedAt?: string
  @ApiPropertyOptional({ description: 'Task result' })
  result?: any
  @ApiPropertyOptional({ description: 'Error message' })
  error?: string
  @ApiPropertyOptional({ description: 'Timeout in milliseconds' })
  timeoutMs?: number
  @ApiPropertyOptional({ description: 'Workflow ID' })
  workflowId?: string
  @ApiPropertyOptional({ description: 'Parent task ID' })
  parentTaskId?: number
  @ApiPropertyOptional({ description: 'Task dependencies' })
  dependsOn?: string[]
}

export class CircuitBreakerStatus {
  @ApiPropertyOptional({ description: 'Action ID' })
  actionId?: string
  @ApiPropertyOptional({ description: 'Provider name' })
  providerName?: string
  @ApiProperty({ description: 'Circuit breaker state' })
  state: 'CLOSED' | 'OPEN' | 'HALF_OPEN'
  @ApiProperty({ description: 'Failure count' })
  failureCount: number
  @ApiProperty({ description: 'Total request count' })
  totalRequestCount: number
  @ApiProperty({ description: 'Failure rate threshold (0.0-1.0)' })
  failureRateThreshold: number
  @ApiProperty({ description: 'Minimum failures before circuit may open' })
  minimumFailures: number
  @ApiProperty({ description: 'Recovery timeout in milliseconds' })
  recoveryTimeoutMs: number
  @ApiProperty({ description: 'Half-open max requests' })
  halfOpenMaxRequests: number
  @ApiProperty({ description: 'Half-open request count' })
  halfOpenRequests: number
  @ApiProperty({ description: 'Current failure rate (0.0-1.0)' })
  failureRate: number
  @ApiPropertyOptional({ description: 'Opened at timestamp' })
  openedAt?: string
  @ApiPropertyOptional({ description: 'Last failure timestamp' })
  lastFailureAt?: string
  @ApiPropertyOptional({ description: 'Last success timestamp' })
  lastSuccessAt?: string
  @ApiPropertyOptional({ description: 'Cooldown remaining in milliseconds' })
  cooldownRemainingMs?: number
}

export class TelemetrySnapshot {
  @ApiProperty({ description: 'Current queue depth' })
  queueDepth: number
  @ApiProperty({ description: 'Active workers' })
  activeWorkers: number
  @ApiProperty({ description: 'Waiting jobs' })
  waitingJobs: number
  @ApiProperty({ description: 'Completed jobs in last 24h' })
  completedJobs24h: number
  @ApiProperty({ description: 'Failed jobs in last 24h' })
  failedJobs24h: number
  @ApiProperty({ description: 'Average latency in last 24h (ms)' })
  avgLatencyMs24h: number
  @ApiProperty({ description: 'P95 latency in last 24h (ms)' })
  p95LatencyMs24h: number
  @ApiProperty({ description: 'P99 latency in last 24h (ms)' })
  p99LatencyMs24h: number
  @ApiProperty({ description: 'Circuit breaker counts' })
  circuitBreakers: { closed: number; open: number; halfOpen: number }
  @ApiProperty({ description: 'SLA breaches in last 24h' })
  slaBreaches24h: number
  @ApiProperty({ description: 'Top errors' })
  topErrors: { error: string; count: number }[]
  @ApiProperty({ description: 'Worker utilization percentage' })
  workerUtilizationPct: number
  @ApiProperty({ description: 'Snapshot timestamp' })
  timestamp: string
}

export class SlaStatus {
  @ApiProperty({ description: 'Action ID' })
  actionId: string
  @ApiProperty({ description: 'Period' })
  period: string
  @ApiProperty({ description: 'Total requests' })
  totalRequests: number
  @ApiProperty({ description: 'Average latency in milliseconds' })
  avgLatencyMs: number
  @ApiProperty({ description: 'P50 latency in milliseconds' })
  p50LatencyMs: number
  @ApiProperty({ description: 'P95 latency in milliseconds' })
  p95LatencyMs: number
  @ApiProperty({ description: 'P99 latency in milliseconds' })
  p99LatencyMs: number
  @ApiProperty({ description: 'Number of breaches' })
  breaches: number
  @ApiProperty({ description: 'Breach rate' })
  breachRate: number
  @ApiProperty({ description: 'SLA target in milliseconds' })
  slaTargetMs: number
  @ApiProperty({ description: 'Whether SLA is met' })
  slaMet: boolean
  @ApiProperty({ description: 'Max latency in milliseconds' })
  maxLatencyMs: number
  @ApiProperty({ description: 'Min latency in milliseconds' })
  minLatencyMs: number
}

export class StreamingEvent {
  @ApiProperty({ description: 'Event type' })
  type: 'task_queued' | 'task_started' | 'task_progress' | 'task_completed' | 'task_failed' | 'task_timeout' | 'circuit_opened' | 'circuit_closed' | 'sla_breach'
  @ApiPropertyOptional({ description: 'Task ID' })
  taskId?: string
  @ApiPropertyOptional({ description: 'Event data' })
  data?: any
  @ApiProperty({ description: 'Event timestamp' })
  timestamp: string
}
