import { Controller, Get, Post, Body, Param, Delete, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { RolesGuard } from '../../common/guards/roles.guard';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Throttle } from '@nestjs/throttler';
import { Role } from '@prisma/client';
import { TradeAgentFederationService } from './trade-agent-federation.service';
import { CollaborationRequestDto, AgentMessageDto, AgentQueryDto } from './dto/federation.dto';

@ApiTags('AI Federation')
@Controller('ai-federation')
@UseGuards(JwtAuthGuard, RolesGuard)
@Throttle({ default: { limit: 20, ttl: 60000 } })
export class FederationController {
  constructor(private readonly federation: TradeAgentFederationService) {}

  @ApiOperation({ summary: 'Get registered agents' })
  @Get('agents')
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  getRegisteredAgents() {
    return this.federation.getRegisteredAgents();
  }

  @ApiOperation({ summary: 'Get all agent capabilities' })
  @Get('capabilities')
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  getCapabilities() {
    return this.federation.getCapabilities();
  }

  @ApiOperation({ summary: 'Get available workflows' })
  @Get('workflows')
  @Roles(Role.ADMIN, Role.SUPER_ADMIN, Role.SELLER, Role.BUYER)
  getWorkflows() {
    return this.federation.getWorkflows();
  }

  @ApiOperation({ summary: 'Execute collaboration pattern' })
  @Post('execute')
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  async execute(@Body() body: { pattern: string; nodes: unknown[]; context: CollaborationRequestDto }) {
    return this.federation.executeCollaboration(
      body.pattern as 'single' | 'parallel' | 'sequential' | 'conditional' | 'nested' | 'coordinator',
      body.nodes as any[],
      { companyId: body.context.companyId, role: body.context.role, payload: body.context.payload, userId: body.context.userId },
    );
  }

  @ApiOperation({ summary: 'Execute workflow by ID' })
  @Post('workflow/:workflowId')
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  async executeWorkflow(
    @Param('workflowId') workflowId: string,
    @Body() context: CollaborationRequestDto,
  ) {
    return this.federation.executeWorkflow(workflowId, {
      companyId: context.companyId,
      role: context.role,
      payload: context.payload,
      userId: context.userId,
    });
  }

  @ApiOperation({ summary: 'Smart execute by goal' })
  @Post('smart')
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  async smartExecute(
    @Body() body: { goal: string; context: CollaborationRequestDto },
  ) {
    return this.federation.smartExecute(body.goal, {
      companyId: body.context.companyId,
      role: body.context.role,
      payload: body.context.payload,
      userId: body.context.userId,
      metadata: body.context as any,
    });
  }

  @ApiOperation({ summary: 'Get federation analytics' })
  @Get('analytics')
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  getAnalytics() {
    return this.federation.getAnalytics();
  }

  @ApiOperation({ summary: 'Get collaboration history' })
  @Get('history')
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  getHistory(@Query('limit') limit?: string, @Query('offset') offset?: string) {
    return this.federation.getCollaborationHistory(Number(limit) || 50, Number(offset) || 0);
  }

  @ApiOperation({ summary: 'Get collaboration graph' })
  @Get('graph')
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  getGraph() {
    return this.federation.getCollaborationGraph();
  }

  @ApiOperation({ summary: 'Get agent utilization stats' })
  @Get('utilization')
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  getUtilization() {
    return this.federation.getAgentUtilization();
  }

  @ApiOperation({ summary: 'Get active collaborations' })
  @Get('active')
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  getActive() {
    return this.federation.getActiveCollaborations();
  }

  @ApiOperation({ summary: 'Cancel collaboration' })
  @Delete('cancel/:collaborationId')
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  cancel(@Param('collaborationId') id: string) {
    const ok = this.federation.cancelCollaboration(id);
    return { cancelled: ok };
  }

  @ApiOperation({ summary: 'Find capable agents' })
  @Get('agents/find')
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  findAgents(@Query() query: AgentQueryDto) {
    return this.federation.findCapableAgents(query.capabilityId || '', query.role);
  }

  @ApiOperation({ summary: 'Send message to agent' })
  @Post('message')
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  sendMessage(@Body() body: AgentMessageDto & { fromAgentId: string }) {
    return {
      messageId: this.federation.sendAgentMessage(
        body.fromAgentId, body.toAgentId, body.action, body.payload, body.collaborationId,
      ),
    };
  }
}

@ApiTags('AI Federation Admin')
@Controller('admin/ai-federation')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN, Role.SUPER_ADMIN)
@Throttle({ default: { limit: 60, ttl: 60000 } })
export class AdminFederationController {
  constructor(private readonly federation: TradeAgentFederationService) {}

  @ApiOperation({ summary: 'Get federation admin dashboard' })
  @Get('dashboard')
  getDashboard() {
    const analytics = this.federation.getAnalytics();
    const agents = this.federation.getRegisteredAgents();
    const workflows = this.federation.getWorkflows();
    const active = this.federation.getActiveCollaborations();
    const graph = this.federation.getCollaborationGraph();

    return { analytics, agents, workflows, active, graph };
  }

  @ApiOperation({ summary: 'Get agent detail information' })
  @Get('agent-detail')
  getAgentDetail() {
    const agents = this.federation.getRegisteredAgents();
    const capabilities = this.federation.getCapabilities();
    const utilization = this.federation.getAgentUtilization();

    return { agents, capabilities, utilization };
  }

  @ApiOperation({ summary: 'Get execution history' })
  @Get('execution-history')
  getExecutionHistory(@Query('limit') limit?: string, @Query('offset') offset?: string) {
    return this.federation.getCollaborationHistory(Number(limit) || 100, Number(offset) || 0);
  }
}
