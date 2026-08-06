import { Injectable, Logger } from '@nestjs/common';
import { v4 as uuid } from 'uuid';
import { AiOrchestratorService } from '../ai-orchestrator/ai-orchestrator.service';
import { AgentRegistryService } from '../agent-framework/agent-registry.service';
import { CapabilityMatchingService } from './capability-matching.service';
import { AgentMessagingService } from './agent-messaging.service';
import {
  CollaborationPattern,
  CollaborationNode,
  FederationContext,
  FederationExecutionResult,
  FederationNodeResult,
} from './interfaces/federation.interfaces';

@Injectable()
export class CollaborationEngine {
  private readonly logger = new Logger(CollaborationEngine.name);
  private activeCollaborations = new Map<string, AbortController>();

  constructor(
    private readonly orchestrator: AiOrchestratorService,
    private readonly agentRegistry: AgentRegistryService,
    private readonly capabilityMatcher: CapabilityMatchingService,
    private readonly messaging: AgentMessagingService,
  ) {}

  async executeSingle(
    agentId: string,
    capabilityId: string,
    context: FederationContext,
  ): Promise<FederationNodeResult> {
    const start = Date.now();
    try {
      this.messaging.broadcast('federation', 'collaboration.started', {
        pattern: 'single',
        agentId,
        capabilityId,
        collaborationId: context.metadata?.collaborationId,
      });

      const result = await this.orchestrator.dispatch({
        actionId: capabilityId,
        companyId: context.companyId,
        userId: context.userId,
        payload: context.payload,
        useCache: true,
      });

      const latencyMs = Date.now() - start;

      this.messaging.broadcast('federation', 'collaboration.completed', {
        agentId,
        capabilityId,
        latencyMs,
        success: true,
      });

      return { nodeId: uuid(), agentId, capabilityId, pattern: 'single', success: true, latencyMs, result };
    } catch (error) {
      const latencyMs = Date.now() - start;
      this.logger.error(`executeSingle failed for agent ${agentId} capability ${capabilityId}`, (error as Error).stack);
      this.messaging.broadcast('federation', 'collaboration.failed', { agentId, capabilityId, error: String(error) });
      return { nodeId: uuid(), agentId, capabilityId, pattern: 'single', success: false, latencyMs, error: String(error) };
    }
  }

  async executeParallel(
    nodes: CollaborationNode[],
    context: FederationContext,
  ): Promise<FederationNodeResult[]> {
    const tasks = nodes.map((node) =>
      this.executeSingle(node.agentId, node.capabilityId, context).then((result) => ({ ...result, nodeId: node.id })),
    );
    return Promise.all(tasks);
  }

  async executeSequential(
    nodes: CollaborationNode[],
    context: FederationContext,
  ): Promise<FederationNodeResult[]> {
    const results: FederationNodeResult[] = [];
    for (const node of nodes) {
      const result = await this.executeSingle(node.agentId, node.capabilityId, context);
      results.push({ ...result, nodeId: node.id });
      if (!result.success) break;
      if (result.result) {
        context.payload = { ...context.payload, [`_${node.agentId}_result`]: result.result };
      }
    }
    return results;
  }

  async executeConditional(
    node: CollaborationNode,
    context: FederationContext,
  ): Promise<FederationNodeResult[]> {
    const results: FederationNodeResult[] = [];
    const conditionMet = this.evaluateCondition(node.condition, context);

    this.messaging.broadcast('federation', 'collaboration.condition', {
      nodeId: node.id,
      condition: node.condition,
      met: conditionMet,
    });

    if (conditionMet && node.children) {
      for (const child of node.children) {
        const result = await this.executeSingle(child.agentId, child.capabilityId, context);
        results.push({ ...result, nodeId: child.id });
      }
    }
    return results;
  }

  async executeNested(
    node: CollaborationNode,
    context: FederationContext,
  ): Promise<FederationNodeResult[]> {
    if (!node.children || node.children.length === 0) {
      const result = await this.executeSingle(node.agentId, node.capabilityId, context);
      return [{ ...result, nodeId: node.id }];
    }
    const parentResult = await this.executeSingle(node.agentId, node.capabilityId, context);
    const results: FederationNodeResult[] = [{ ...parentResult, nodeId: node.id }];

    if (parentResult.success && node.children) {
      const childContext: FederationContext = {
        ...context,
        payload: { ...context.payload, _parentResult: parentResult.result },
      };
      for (const child of node.children) {
        const childResults = await this.executeNodeWithPattern(child, childContext);
        results.push(...childResults);
      }
    }
    return results;
  }

  async executeCoordinator(
    coordinatorNode: CollaborationNode,
    context: FederationContext,
  ): Promise<FederationNodeResult[]> {
    const results: FederationNodeResult[] = [];

    const coordinatorResult = await this.executeSingle(coordinatorNode.agentId, coordinatorNode.capabilityId, context);
    results.push({ ...coordinatorResult, nodeId: coordinatorNode.id });

    if (coordinatorResult.success && coordinatorNode.children) {
      const coordinationPlan = coordinatorResult.result as { tasks?: { agentId: string; capabilityId: string; dependsOn?: string[] }[] };
      const tasks = coordinationPlan?.tasks || coordinatorNode.children;

      if (tasks.length === 0) return results;

      const completed = new Set<string>();
      const remaining = [...tasks];
      let pass = 0;
      const maxPasses = 10;

      while (remaining.length > 0 && pass < maxPasses) {
        pass++;
        const batch: typeof tasks = [];

        for (let i = remaining.length - 1; i >= 0; i--) {
          const task = remaining[i];
          const depsSatisfied = !task.dependsOn || task.dependsOn.every((d) => completed.has(d));
          if (depsSatisfied) {
            batch.push(task);
            remaining.splice(i, 1);
          }
        }

        if (batch.length === 0 && remaining.length > 0) break;

        const batchResults = await Promise.all(
          batch.map((task) =>
            this.executeSingle(task.agentId, task.capabilityId, context).then((r) => ({ ...r, nodeId: `${task.agentId}_${task.capabilityId}` })),
          ),
        );
        for (const r of batchResults) {
          results.push(r);
          completed.add(`${r.agentId}_${r.capabilityId}`);
        }
      }
    }
    return results;
  }

  async executeNodeWithPattern(node: CollaborationNode, context: FederationContext): Promise<FederationNodeResult[]> {
    switch (node.pattern) {
      case 'single':
        return [(await this.executeSingle(node.agentId, node.capabilityId, context))];
      case 'parallel':
        return this.executeParallel(node.children || [], context);
      case 'sequential':
        return this.executeSequential(node.children || [], context);
      case 'conditional':
        return this.executeConditional(node, context);
      case 'nested':
        return this.executeNested(node, context);
      case 'coordinator':
        return this.executeCoordinator(node, context);
      default:
        return [(await this.executeSingle(node.agentId, node.capabilityId, context))];
    }
  }

  async executeWorkflow(
    pattern: CollaborationPattern,
    nodes: CollaborationNode[],
    context: FederationContext,
  ): Promise<FederationExecutionResult> {
    const start = Date.now();
    const collaborationId = uuid();

    this.activeCollaborations.set(collaborationId, new AbortController());
    context.metadata = { ...context.metadata, collaborationId };

    try {
      const allResults: FederationNodeResult[] = [];
      const rootNode: CollaborationNode = {
        id: 'root',
        agentId: 'federation',
        capabilityId: 'coordinator',
        pattern,
        children: nodes,
      };

      const results = await this.executeNodeWithPattern(rootNode, context);
      allResults.push(...results);

      const success = allResults.every((r) => r.success);
      const totalLatencyMs = Date.now() - start;

      this.messaging.broadcast('federation', 'workflow.completed', {
        collaborationId,
        pattern,
        nodeCount: allResults.length,
        success,
        totalLatencyMs,
      });

      return { collaborationId, pattern, nodes: allResults, totalLatencyMs, success };
    } catch (error) {
      this.logger.error(`executeCoordinator failed for collaboration ${collaborationId}`, (error as Error).stack);
      this.messaging.broadcast('federation', 'workflow.failed', { collaborationId, error: String(error) });
      return {
        collaborationId,
        pattern,
        nodes: [],
        totalLatencyMs: Date.now() - start,
        success: false,
        error: String(error),
      };
    } finally {
      this.activeCollaborations.delete(collaborationId);
    }
  }

  cancelCollaboration(collaborationId: string): boolean {
    const ctrl = this.activeCollaborations.get(collaborationId);
    if (ctrl) {
      ctrl.abort();
      this.activeCollaborations.delete(collaborationId);
      return true;
    }
    return false;
  }

  getActiveCollaborations(): string[] {
    return Array.from(this.activeCollaborations.keys());
  }

  private evaluateCondition(condition: string | undefined, context: FederationContext): boolean {
    if (!condition) return true;
    try {
      const payload = context.payload;
      const parts = condition.split(' ');
      if (parts.length === 3) {
        const [key, operator, value] = parts;
        const actualValue = String(this.resolveNestedValue(payload, key));
        switch (operator) {
          case '==': return actualValue === value;
          case '!=': return actualValue !== value;
          case '>': return Number(actualValue) > Number(value);
          case '<': return Number(actualValue) < Number(value);
          case '>=': return Number(actualValue) >= Number(value);
          case '<=': return Number(actualValue) <= Number(value);
          case 'contains': return actualValue.includes(value);
        }
      }
      if (condition.startsWith('has:')) {
        const key = condition.slice(4);
        return this.resolveNestedValue(payload, key) !== undefined && this.resolveNestedValue(payload, key) !== null;
      }
      return true;
    } catch {
      return true;
    }
  }

  private resolveNestedValue(obj: unknown, path: string): unknown {
    return path.split('.').reduce((acc: unknown, part: string) => {
      if (acc && typeof acc === 'object') return (acc as Record<string, unknown>)[part];
      return undefined;
    }, obj);
  }
}
