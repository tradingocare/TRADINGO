import { Controller, Get, Post, Body, Param, Req, UseGuards, NotFoundException } from '@nestjs/common'
import { ApiTags, ApiOperation } from '@nestjs/swagger'
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard'
import { RolesGuard } from '../../common/guards/roles.guard'
import { Roles } from '../../common/decorators/roles.decorator'
import { Throttle } from '@nestjs/throttler'
import { AiOrchestratorService } from './ai-orchestrator.service'

interface RequestWithUser extends Request {
  user?: { id: string; companyId?: string; role?: string }
}
import { AiWorkflowEngine } from './ai-workflow-engine.service'
import { AiActionRegistry } from './ai-action-registry'
import { AiMemoryService } from './ai-memory.service'
import { AiObservabilityService } from './ai-observability.service'
import { AiContextEngine } from './ai-context-engine.service'
import { OrchestrateRequestDto, WorkflowExecuteDto, ContextRequestDto, OrchestrateResponseDto, WorkflowExecuteResponseDto } from './dto/ai-orchestrator.dto'

@ApiTags('AI Orchestrator')
@Controller('ai')
@UseGuards(JwtAuthGuard, RolesGuard)
@Throttle({ default: { limit: 30, ttl: 60000 } })
export class AiOrchestratorController {
  constructor(
    private readonly orchestrator: AiOrchestratorService,
    private readonly workflowEngine: AiWorkflowEngine,
    private readonly registry: AiActionRegistry,
    private readonly memory: AiMemoryService,
    private readonly observability: AiObservabilityService,
    private readonly contextEngine: AiContextEngine,
  ) {}

  @ApiOperation({ summary: 'Orchestrate AI action' })
  @Post('orchestrate')
  async orchestrate(@Body() dto: OrchestrateRequestDto, @Req() req: RequestWithUser): Promise<OrchestrateResponseDto> {
    if (!dto.userId) dto.userId = req.user?.id
    return this.orchestrator.dispatch(dto)
  }

  @ApiOperation({ summary: 'Execute AI workflow' })
  @Post('workflow/:id/execute')
  async executeWorkflow(@Param('id') id: string, @Body() dto: WorkflowExecuteDto, @Req() req: RequestWithUser): Promise<WorkflowExecuteResponseDto> {
    if (!dto.userId) dto.userId = req.user?.id
    dto.workflowId = id
    return this.workflowEngine.execute(dto)
  }

  @ApiOperation({ summary: 'List available AI actions' })
  @Get('actions')
  listActions() {
    const actions = this.orchestrator.getAvailableActions()
    return { total: actions.length, actions }
  }

  @ApiOperation({ summary: 'Get AI action by ID' })
  @Get('actions/:id')
  getAction(@Param('id') id: string) {
    const action = this.registry.getById(id)
    if (!action) throw new NotFoundException(`Action '${id}' not found`)
    const available = this.orchestrator.isActionAvailable(id)
    return { ...action, available }
  }

  @ApiOperation({ summary: 'Get aggregated AI context' })
  @Post('context')
  async getContext(@Body() dto: ContextRequestDto) {
    return this.contextEngine.getAggregatedContext(dto)
  }

  @ApiOperation({ summary: 'Get AI memory stats' })
  @Get('orchestrator/memory')
  memoryStats() {
    return this.memory.getStats()
  }

  @ApiOperation({ summary: 'Get AI observability stats' })
  @Get('orchestrator/observability')
  observabilityStats() {
    return {
      stats: this.observability.getStats(),
      recent: this.observability.getRecent(10),
    }
  }

  @ApiOperation({ summary: 'Clear AI memory and observability cache' })
  @Post('orchestrator/cache/clear')
  @Roles('ADMIN', 'SUPER_ADMIN')
  clearCache() {
    this.memory.clear()
    this.observability.clear()
    return { cleared: true }
  }
}
