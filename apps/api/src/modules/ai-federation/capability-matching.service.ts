import { Injectable, Logger } from '@nestjs/common';
import { AgentRegistryService } from '../agent-framework/agent-registry.service';
import { TradeAgentCapability } from '../agent-framework/interfaces/agent.interfaces';

export interface MatchResult {
  agentId: string;
  agentName: string;
  capability: TradeAgentCapability;
  confidence: number;
  priority: 'primary' | 'fallback' | 'last-resort';
}

@Injectable()
export class CapabilityMatchingService {
  private readonly logger = new Logger(CapabilityMatchingService.name);

  constructor(private readonly agentRegistry: AgentRegistryService) {}

  findBestAgent(capabilityId: string, context: { role?: string; tags?: string[] }): MatchResult | null {
    const agents = this.agentRegistry.getAllAgents();
    const candidates: MatchResult[] = [];

    for (const agent of agents) {
      const cap = agent.capabilities.find(
        (c) => c.id === capabilityId || c.name.toLowerCase() === capabilityId.toLowerCase(),
      );
      if (!cap) continue;

      if (context.role && !agent.roles.includes(context.role)) continue;

      const confidence = this.calculateConfidence(agent, cap, context);
      const priority = confidence >= 0.8 ? 'primary' : confidence >= 0.4 ? 'fallback' : 'last-resort';

      candidates.push({ agentId: agent.id, agentName: agent.name, capability: cap, confidence, priority });
    }

    if (candidates.length === 0) return null;

    candidates.sort((a, b) => b.confidence - a.confidence);
    return candidates[0];
  }

  findCollaborationAgents(
    capabilityIds: string[],
    context: { role?: string; tags?: string[] },
  ): Map<string, MatchResult> {
    const result = new Map<string, MatchResult>();
    for (const capId of capabilityIds) {
      const match = this.findBestAgent(capId, context);
      if (match) result.set(capId, match);
    }
    return result;
  }

  findFallbackChain(capabilityId: string, context: { role?: string; tags?: string[] }): MatchResult[] {
    const agents = this.agentRegistry.getAllAgents();
    const candidates: MatchResult[] = [];

    for (const agent of agents) {
      const cap = agent.capabilities.find(
        (c) => c.id === capabilityId || c.name.toLowerCase() === capabilityId.toLowerCase(),
      );
      if (!cap) continue;
      if (context.role && !agent.roles.includes(context.role)) continue;

      const confidence = this.calculateConfidence(agent, cap, context);
      if (confidence < 0.2) continue;

      const priority = confidence >= 0.8 ? 'primary' : confidence >= 0.4 ? 'fallback' : 'last-resort';
      candidates.push({ agentId: agent.id, agentName: agent.name, capability: cap, confidence, priority });
    }

    candidates.sort((a, b) => b.confidence - a.confidence);
    return candidates;
  }

  private calculateConfidence(
    agent: { id: string; capabilities: TradeAgentCapability[] },
    _capability: TradeAgentCapability,
    _context: { role?: string; tags?: string[] },
  ): number {
    let score = 0.5;
    if (agent.id === 'seller' && _context.tags?.includes('product')) score += 0.3;
    if (agent.id === 'buyer' && _context.tags?.includes('rfq')) score += 0.3;
    if (agent.id === 'admin' && _context.tags?.includes('platform')) score += 0.3;
    if (agent.id === 'founder' && _context.tags?.includes('insight')) score += 0.3;
    if (_capability.id.includes(_capability.id.toLowerCase())) score += 0.1;
    return Math.min(1, score);
  }
}
