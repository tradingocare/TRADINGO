import {
  Controller, Get, Post, Patch, Delete, Body, Param, Query,
  UseGuards, HttpCode, HttpStatus, Sse, MessageEvent,
} from '@nestjs/common'
import { ApiTags, ApiOperation } from '@nestjs/swagger'
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard'
import { RolesGuard } from '../../common/guards/roles.guard'
import { Roles } from '../../common/decorators/roles.decorator'
import { Throttle } from '@nestjs/throttler'
import { AiAgentRuntimeService } from './ai-agent-runtime.service'
import { AiCircuitBreakerService } from './ai-circuit-breaker.service'
import { AiSlaEngineService } from './ai-sla-engine.service'
import { AiStreamingRuntimeService } from './ai-streaming-runtime.service'
import { AiTelemetryService } from './ai-telemetry.service'
import {
  EnqueueTaskDto, DispatchActionDto, ExecuteWorkflowDto, ParallelBatchDto,
  CircuitBreakerConfigDto, SlaConfigDto,
} from './dto/ai-runtime.dto'
import { Observable, interval, from, switchMap, map } from 'rxjs'

@ApiTags('AI Runtime')
@Controller('ai-runtime')
@Throttle({ default: { limit: 20, ttl: 60000 } })
export class AiRuntimeController {
  constructor(
    private readonly runtime: AiAgentRuntimeService,
    private readonly circuitBreaker: AiCircuitBreakerService,
    private readonly slaEngine: AiSlaEngineService,
    private readonly streaming: AiStreamingRuntimeService,
    private readonly telemetry: AiTelemetryService,
  ) {}

  @ApiOperation({ summary: 'Enqueue AI task' })
  @Post('enqueue')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SELLER', 'BUYER')
  @HttpCode(HttpStatus.ACCEPTED)
  async enqueueTask(@Body() dto: EnqueueTaskDto) {
    return this.runtime.enqueueTask(dto)
  }

  @ApiOperation({ summary: 'Dispatch AI action' })
  @Post('dispatch')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SELLER', 'BUYER')
  @HttpCode(HttpStatus.ACCEPTED)
  async dispatchAction(@Body() dto: DispatchActionDto) {
    return this.runtime.dispatchAction(dto)
  }

  @ApiOperation({ summary: 'Execute AI workflow' })
  @Post('workflow')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SELLER', 'BUYER')
  @HttpCode(HttpStatus.ACCEPTED)
  async executeWorkflow(@Body() dto: ExecuteWorkflowDto) {
    return this.runtime.executeWorkflow(dto)
  }

  @ApiOperation({ summary: 'Execute parallel batch' })
  @Post('parallel')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SELLER', 'BUYER')
  @HttpCode(HttpStatus.ACCEPTED)
  async executeParallel(@Body() dto: ParallelBatchDto) {
    return this.runtime.executeParallel(dto)
  }

  @ApiOperation({ summary: 'List AI tasks' })
  @Get('tasks')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SELLER', 'BUYER')
  async listTasks(
    @Query('status') status?: string,
    @Query('limit') limit?: string,
  ) {
    return this.runtime.listTasks(status as any, limit ? parseInt(limit) : 50)
  }

  @ApiOperation({ summary: 'Get task by ID' })
  @Get('tasks/:taskId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SELLER', 'BUYER')
  async getTask(@Param('taskId') taskId: string) {
    const task = await this.runtime.getTask(taskId)
    if (!task) return { error: 'Task not found' }
    return task
  }

  @ApiOperation({ summary: 'Cancel AI task' })
  @Delete('tasks/:taskId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @HttpCode(HttpStatus.OK)
  async cancelTask(@Param('taskId') taskId: string) {
    const cancelled = await this.runtime.cancelTask(taskId)
    return { cancelled }
  }

  @ApiOperation({ summary: 'Get queue counts' })
  @Get('queue/counts')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  async getQueueCounts() {
    return this.runtime.getQueueCounts()
  }

  @ApiOperation({ summary: 'Get circuit breaker statuses' })
  @Get('circuit-breakers')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  async getCircuitBreakers() {
    return this.circuitBreaker.getAllStatuses()
  }

  @ApiOperation({ summary: 'Set circuit breaker config' })
  @Post('circuit-breakers/config')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @HttpCode(HttpStatus.OK)
  async setCircuitBreakerConfig(@Body() dto: CircuitBreakerConfigDto) {
    if (dto.actionId) {
      await this.circuitBreaker.setPerActionConfig(dto.actionId, dto)
    }
    return { updated: true }
  }

  @ApiOperation({ summary: 'Reset circuit breaker' })
  @Post('circuit-breakers/:key/reset')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @HttpCode(HttpStatus.OK)
  async resetCircuitBreaker(@Param('key') key: string) {
    await this.circuitBreaker.reset(key)
    return { reset: true }
  }

  @ApiOperation({ summary: 'Reset all circuit breakers' })
  @Post('circuit-breakers/reset-all')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @HttpCode(HttpStatus.OK)
  async resetAllCircuitBreakers() {
    await this.circuitBreaker.resetAll()
    return { reset: true }
  }

  @ApiOperation({ summary: 'Get SLA statuses' })
  @Get('sla')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  async getSlaStatuses() {
    return this.slaEngine.getAllStatuses()
  }

  @ApiOperation({ summary: 'Get SLA status by action' })
  @Get('sla/:actionId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  async getSlaStatus(@Param('actionId') actionId: string) {
    return this.slaEngine.getStatus(actionId)
  }

  @ApiOperation({ summary: 'Set SLA config' })
  @Post('sla/config')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @HttpCode(HttpStatus.OK)
  async setSlaConfig(@Body() dto: SlaConfigDto) {
    if (dto.actionId) {
      this.slaEngine.setConfig(dto.actionId, dto)
    }
    return { updated: true }
  }

  @ApiOperation({ summary: 'Get telemetry snapshot' })
  @Get('telemetry')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  async getTelemetry() {
    return this.telemetry.getSnapshot()
  }

  @ApiOperation({ summary: 'Get provider telemetry stats' })
  @Get('telemetry/providers')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  async getProviderStats() {
    return this.telemetry.getDetailedProviderStats()
  }

  @ApiOperation({ summary: 'Stream AI runtime events' })
  @Sse('stream')
  streamEvents(): Observable<MessageEvent> {
    return this.streaming.getStream().pipe(
      map(event => ({
        type: 'ai-event',
        data: event,
      }) as MessageEvent),
    )
  }

  @ApiOperation({ summary: 'Stream AI task events' })
  @Sse('stream/:taskId')
  streamTask(@Param('taskId') taskId: string): Observable<MessageEvent> {
    return this.streaming.getStream(taskId).pipe(
      map(event => ({
        type: 'ai-event',
        data: event,
      }) as MessageEvent),
    )
  }

  @ApiOperation({ summary: 'Get AI runtime health' })
  @Get('health')
  async health() {
    const queueCounts = await this.runtime.getQueueCounts()
    const circuitSummary = this.circuitBreaker.getSummary()
    return {
      status: 'operational',
      queue: { active: queueCounts.active, waiting: queueCounts.waiting },
      circuitBreakers: circuitSummary,
      timestamp: new Date().toISOString(),
    }
  }
}
