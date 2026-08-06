import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { v4 as uuid } from 'uuid';
import { AgentRegistryService } from '../agent-framework/agent-registry.service';
import { CapabilityMatchingService } from './capability-matching.service';
import { CollaborationEngine } from './collaboration-engine';
import { CrossAgentWorkflowService } from './cross-agent-workflow.service';
import { AgentMessagingService } from './agent-messaging.service';
import { FederationAnalyticsService } from './federation-analytics.service';
import {
  CollaborationPattern,
  CollaborationNode,
  FederationContext,
  FederationExecutionResult,
  FederationAnalytics,
} from './interfaces/federation.interfaces';

@Injectable()
export class TradeAgentFederationService {
  private readonly logger = new Logger(TradeAgentFederationService.name);

  constructor(
    private readonly agentRegistry: AgentRegistryService,
    private readonly capabilityMatcher: CapabilityMatchingService,
    private readonly collaborationEngine: CollaborationEngine,
    private readonly workflowService: CrossAgentWorkflowService,
    private readonly messaging: AgentMessagingService,
    private readonly analytics: FederationAnalyticsService,
    private readonly eventBus: EventEmitter2,
  ) {}

  getRegisteredAgents() {
    return this.agentRegistry.getSummary();
  }

  getCapabilities() {
    return this.agentRegistry.getAllAgents().flatMap((a) =>
      a.capabilities.map((c) => ({ agentId: a.id, agentName: a.name, capabilityId: c.id, capabilityName: c.name })),
    );
  }

  getWorkflows() {
    return this.workflowService.getWorkflows();
  }

  getAnalytics(): FederationAnalytics {
    return this.analytics.getSummary();
  }

  getCollaborationHistory(limit = 50, offset = 0) {
    return this.analytics.getHistory(limit, offset);
  }

  getCollaborationGraph() {
    return this.analytics.getCollaborationGraph();
  }

  getAgentUtilization() {
    return this.analytics.getAgentUtilizationData();
  }

  async executeCollaboration(
    pattern: CollaborationPattern,
    nodes: CollaborationNode[],
    context: FederationContext,
  ): Promise<FederationExecutionResult> {
    this.logger.log(`Federated execution: ${pattern} with ${nodes.length} nodes`);
    this.eventBus.emit('federation.collaboration.started', { pattern, nodeCount: nodes.length, context });

    const result = await this.collaborationEngine.executeWorkflow(pattern, nodes, context);

    this.eventBus.emit('federation.collaboration.completed', result);
    return result;
  }

  async executeWorkflow(
    workflowId: string,
    context: FederationContext,
  ): Promise<FederationExecutionResult> {
    return this.workflowService.executeWorkflow(workflowId, context);
  }

  async smartExecute(
    goal: string,
    context: FederationContext,
  ): Promise<FederationExecutionResult> {
    const capabilityIds = this.inferCapabilities(goal);
    const matches = this.capabilityMatcher.findCollaborationAgents(capabilityIds, {
      role: context.role,
      tags: context.metadata?.tags as string[] | undefined,
    });

    if (matches.size === 0) {
      return {
        collaborationId: uuid(),
        pattern: 'single',
        nodes: [],
        totalLatencyMs: 0,
        success: false,
        error: `No agents match capabilities for goal: ${goal}`,
      };
    }

    const nodes: CollaborationNode[] = Array.from(matches.entries()).map(([capId, match], idx) => ({
      id: `${match.agentId}_${capId}_${idx}`,
      agentId: match.agentId,
      capabilityId: capId,
      pattern: 'single',
    }));

    const pattern: CollaborationPattern = nodes.length === 1 ? 'single' : 'sequential';
    return this.executeCollaboration(pattern, nodes, context);
  }

  cancelCollaboration(collaborationId: string): boolean {
    return this.collaborationEngine.cancelCollaboration(collaborationId);
  }

  getActiveCollaborations(): string[] {
    return this.collaborationEngine.getActiveCollaborations();
  }

  findCapableAgents(capabilityId: string, role?: string) {
    return this.capabilityMatcher.findFallbackChain(capabilityId, { role });
  }

  sendAgentMessage(fromAgentId: string, toAgentId: string, action: string, payload: unknown, collaborationId?: string): string {
    return this.messaging.request(fromAgentId, toAgentId, action, payload, collaborationId);
  }

  private inferCapabilities(goal: string): string[] {
    const lower = goal.toLowerCase();
    const caps: string[] = [];

    if (lower.includes('rfq') || lower.includes('quote') || lower.includes('procure')) caps.push('rfq-assistant');
    if (lower.includes('product') || lower.includes('catalog')) caps.push('product-intelligence');
    if (lower.includes('price') || lower.includes('pricing') || lower.includes('cost')) caps.push('pricing-advisor');
    if (lower.includes('supplier') || lower.includes('vendor')) caps.push('supplier-intelligence');
    if (lower.includes('market') || lower.includes('insight') || lower.includes('trend')) caps.push('marketplace-intelligence');
    if (lower.includes('negoti') || lower.includes('deal')) caps.push('negotiation-advisor');
    if (lower.includes('health') || lower.includes('system') || lower.includes('platform')) caps.push('system-health');
    if (lower.includes('fraud') || lower.includes('risk')) caps.push('fraud-intelligence');
    if (lower.includes('revenue') || lower.includes('growth') || lower.includes('analytics')) caps.push('revenue-analytics');
    if (lower.includes('user') || lower.includes('activity')) caps.push('user-activity');
    if (lower.includes('seo') || lower.includes('search')) caps.push('product-intelligence');
    if (lower.includes('ad') || lower.includes('promotion') || lower.includes('campaign')) caps.push('pricing-advisor');
    if (lower.includes('digital twin') || lower.includes('platform health') || lower.includes('business confidence') || lower.includes('confidence index')) caps.push('health-index');
    if (lower.includes('supply') || lower.includes('demand') || lower.includes('shortage') || lower.includes('oversupply')) caps.push('supply-demand');
    if (lower.includes('momentum') || lower.includes('trending')) caps.push('category-momentum');
    if (lower.includes('regional') || lower.includes('heatmap') || lower.includes('geographic')) caps.push('regional-heatmap');
    if (lower.includes('predict') || lower.includes('forecast') || lower.includes('future')) caps.push('predictions');
    if (lower.includes('opportunity') || lower.includes('emerging') || lower.includes('expansion')) caps.push('opportunities');
    if (lower.includes('recommend')) caps.push('recommendations');
    if (lower.includes('enterprise') && lower.includes('intelligence')) caps.push('full-intelligence');
    if (caps.length === 0) caps.push('dashboard-copilot');

    return caps;
  }
}
