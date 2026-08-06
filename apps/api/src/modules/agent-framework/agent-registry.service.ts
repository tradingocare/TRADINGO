import { Injectable, Logger } from '@nestjs/common';
import { TradeAgentMetadata, TradeAgentCapability } from './interfaces/agent.interfaces';

@Injectable()
export class AgentRegistryService {
  private readonly logger = new Logger(AgentRegistryService.name);
  private readonly agents = new Map<string, TradeAgentMetadata>();

  register(metadata: TradeAgentMetadata): void {
    if (this.agents.has(metadata.id)) {
      this.logger.warn(`Agent ${metadata.id} already registered — overwriting`);
    }
    this.agents.set(metadata.id, metadata);
    this.logger.log(`Registered agent: ${metadata.name} (${metadata.capabilities.length} capabilities)`);
  }

  getAgent(id: string): TradeAgentMetadata | undefined {
    return this.agents.get(id);
  }

  getAllAgents(): TradeAgentMetadata[] {
    return Array.from(this.agents.values());
  }

  getCapability(agentId: string, capabilityId: string): TradeAgentCapability | undefined {
    const agent = this.agents.get(agentId);
    return agent?.capabilities.find(c => c.id === capabilityId);
  }

  findAgentsByRole(role: string): TradeAgentMetadata[] {
    return this.getAllAgents().filter(a => a.roles.includes(role));
  }

  findAgentsByTag(tag: string): TradeAgentMetadata[] {
    return this.getAllAgents().filter(a => a.capabilities.some(c => c.tags.includes(tag)));
  }

  findCapabilitiesByTag(tag: string): { agentId: string; capability: TradeAgentCapability }[] {
    const result: { agentId: string; capability: TradeAgentCapability }[] = [];
    for (const [agentId, agent] of this.agents) {
      for (const cap of agent.capabilities) {
        if (cap.tags.includes(tag)) result.push({ agentId, capability: cap });
      }
    }
    return result;
  }

  getSummary(): { totalAgents: number; totalCapabilities: number; byRole: Record<string, number> } {
    const byRole: Record<string, number> = {};
    for (const agent of this.agents.values()) {
      for (const role of agent.roles) {
        byRole[role] = (byRole[role] || 0) + 1;
      }
    }
    return {
      totalAgents: this.agents.size,
      totalCapabilities: Array.from(this.agents.values()).reduce((s, a) => s + a.capabilities.length, 0),
      byRole,
    };
  }
}
