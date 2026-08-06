import { Injectable, Logger } from '@nestjs/common'
import { InjectQueue } from '@nestjs/bullmq'
import { Queue } from 'bullmq'
import { EventEmitter2 } from '@nestjs/event-emitter'
import { PrismaService } from '../../prisma/prisma.service'
import { QueueNames, AiJobData, AiJobTypes } from '../../jobs/queues'
import { AiGatewayService } from '../ai-gateway/ai-gateway.service'
import { AiOrchestratorService } from '../ai-orchestrator/ai-orchestrator.service'
import { AiWorkflowEngine } from '../ai-orchestrator/ai-workflow-engine.service'
import { AiCircuitBreakerService } from './ai-circuit-breaker.service'
import { AiSlaEngineService } from './ai-sla-engine.service'
import { AiObservabilityService } from '../ai-orchestrator/ai-observability.service'
import {
  AiTaskInfo, AiTaskStatus, AiTaskPriority, AiTaskType,
  EnqueueTaskDto, DispatchActionDto, ExecuteWorkflowDto, ParallelBatchDto,
} from './dto/ai-runtime.dto'

@Injectable()
export class AiAgentRuntimeService {
  private readonly logger = new Logger(AiAgentRuntimeService.name)
  private readonly activeTasks = new Map<string, AiTaskInfo>()
  private tasksCounter = 0

  constructor(
    @InjectQueue(QueueNames.AI) private readonly aiQueue: Queue<AiJobData>,
    private readonly eventEmitter: EventEmitter2,
    private readonly prisma: PrismaService,
    private readonly gateway: AiGatewayService,
    private readonly orchestrator: AiOrchestratorService,
    private readonly workflowEngine: AiWorkflowEngine,
    private readonly circuitBreaker: AiCircuitBreakerService,
    private readonly slaEngine: AiSlaEngineService,
    private readonly observability: AiObservabilityService,
  ) {}

  async enqueueTask(dto: EnqueueTaskDto): Promise<AiTaskInfo> {
    const taskId = `task_${++this.tasksCounter}_${Date.now()}`
    const priority = dto.priority ?? AiTaskPriority.MEDIUM
    const timeoutMs = dto.timeoutMs ?? 30000

    this.logger.log(`Enqueuing task '${taskId}' type=${dto.taskType} priority=${priority}`)

    const job = await this.aiQueue.add(
      this.getJobType(dto.taskType),
      {
        type: this.getJobType(dto.taskType),
        companyId: dto.companyId,
        userId: dto.userId || dto.companyId,
        productIds: [],
        options: {
          taskId,
          taskType: dto.taskType,
          actionId: dto.actionId,
          payload: dto.payload,
          gatewayTaskType: dto.gatewayTaskType,
          workflowId: dto.workflowId,
          parentTaskId: dto.parentTaskId,
          dependsOn: dto.dependsOn,
          maxRetries: dto.maxRetries,
          timeoutMs,
        },
      },
      {
        priority,
        attempts: (dto.maxRetries ?? 2) + 1,
        backoff: { type: 'exponential', delay: 2000 },
        removeOnComplete: { age: 86400 },
        removeOnFail: { age: 604800 },
      },
    )

    const task: AiTaskInfo = {
      id: taskId,
      jobId: job.id?.toString(),
      type: dto.taskType,
      status: AiTaskStatus.QUEUED,
      companyId: dto.companyId,
      userId: dto.userId,
      actionId: dto.actionId,
      priority,
      progress: 0,
      createdAt: new Date().toISOString(),
      timeoutMs,
      workflowId: dto.workflowId,
      parentTaskId: dto.parentTaskId,
      dependsOn: dto.dependsOn,
    }

    this.activeTasks.set(taskId, task)
    this.emitEvent('task_queued', task)

    return task
  }

  async dispatchAction(dto: DispatchActionDto): Promise<AiTaskInfo> {
    return this.enqueueTask({
      taskType: AiTaskType.SINGLE_INFERENCE,
      companyId: dto.companyId,
      userId: dto.userId,
      actionId: dto.actionId,
      payload: dto.payload,
      priority: dto.priority ?? AiTaskPriority.MEDIUM,
      timeoutMs: dto.timeoutMs ?? 30000,
    })
  }

  async executeWorkflow(dto: ExecuteWorkflowDto): Promise<AiTaskInfo> {
    return this.enqueueTask({
      taskType: AiTaskType.WORKFLOW,
      companyId: dto.companyId,
      userId: dto.userId,
      payload: dto.context,
      priority: dto.priority ?? AiTaskPriority.MEDIUM,
      workflowId: dto.workflowId,
      timeoutMs: 120000,
    })
  }

  async executeParallel(dto: ParallelBatchDto): Promise<AiTaskInfo[]> {
    const tasks: AiTaskInfo[] = []
    for (const action of dto.actions) {
      const task = await this.enqueueTask({
        taskType: AiTaskType.PARALLEL_BATCH,
        companyId: dto.companyId,
        userId: dto.userId,
        actionId: action.actionId,
        payload: action.payload,
        priority: action.priority ?? dto.priority ?? AiTaskPriority.MEDIUM,
        timeoutMs: action.timeoutMs ?? 30000,
      })
      tasks.push(task)
    }
    this.logger.log(`Parallel batch: ${tasks.length} tasks enqueued`)
    return tasks
  }

  async getTask(taskId: string): Promise<AiTaskInfo | null> {
    const task = this.activeTasks.get(taskId)
    if (!task) return null

    if (task.jobId) {
      const job = await this.aiQueue.getJob(task.jobId)
      if (job) {
        if (typeof job.progress === 'number') task.progress = job.progress
        if (job.failedReason) task.status = AiTaskStatus.FAILED
        else if (job.finishedOn && !job.failedReason) task.status = AiTaskStatus.COMPLETED
        else if (job.processedOn && !job.finishedOn) task.status = AiTaskStatus.RUNNING
      }
    }
    return task
  }

  async listTasks(status?: AiTaskStatus, limit = 50): Promise<AiTaskInfo[]> {
    let tasks = Array.from(this.activeTasks.values())
    if (status) tasks = tasks.filter(t => t.status === status)
    return tasks.slice(-limit).reverse()
  }

  async cancelTask(taskId: string): Promise<boolean> {
    const task = this.activeTasks.get(taskId)
    if (!task) return false
    if (task.jobId) {
      const job = await this.aiQueue.getJob(task.jobId)
      if (job) {
        await job.remove()
      }
    }
    task.status = AiTaskStatus.CANCELLED
    this.emitEvent('task_failed', { ...task, error: 'Cancelled by user' })
    return true
  }

  async getQueueDepth(): Promise<number> {
    const counts = await this.aiQueue.getJobCounts()
    return (counts.waiting || 0) + (counts.active || 0) + (counts.delayed || 0)
  }

  async getQueueCounts() {
    return this.aiQueue.getJobCounts()
  }

  updateTaskStatus(taskId: string, status: AiTaskStatus, updates?: Partial<AiTaskInfo>): void {
    const task = this.activeTasks.get(taskId)
    if (task) {
      task.status = status
      if (updates) Object.assign(task, updates)
      this.emitEvent(status === AiTaskStatus.RUNNING ? 'task_started' : status === AiTaskStatus.COMPLETED ? 'task_completed' : 'task_failed', task)
    }
  }

  private getJobType(taskType: AiTaskType): AiJobTypes {
    switch (taskType) {
      case AiTaskType.BULK_PROCESS: return AiJobTypes.PROCESS_BULK
      case AiTaskType.WORKFLOW: return AiJobTypes.PROCESS_BULK
      default: return AiJobTypes.GENERATE_DESCRIPTION
    }
  }

  private emitEvent(type: string, data: any): void {
    try {
      this.eventEmitter.emit('ai-runtime.event', { type: `task_${type.split('_')[1]}`, taskId: data.id, data, timestamp: new Date().toISOString() })
    } catch {
      this.logger.error(`Failed to emit runtime event: ${type}`);
    }
  }
}
