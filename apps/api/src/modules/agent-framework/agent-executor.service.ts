import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { AgentRegistryService } from './agent-registry.service';
import { TradeAgentContext, TradeAgentExecutionResult } from './interfaces/agent.interfaces';

@Injectable()
export class AgentExecutorService {
  private readonly logger = new Logger(AgentExecutorService.name);

  constructor(private readonly registry: AgentRegistryService) {}

  async execute<T>(
    agentId: string,
    capabilityId: string,
    context: TradeAgentContext,
    handler: () => Promise<T>,
  ): Promise<TradeAgentExecutionResult<T>> {
    const start = Date.now();

    const agent = this.registry.getAgent(agentId);
    if (!agent) throw new BadRequestException(`Agent ${agentId} not registered`);

    const capability = this.registry.getCapability(agentId, capabilityId);
    if (!capability) throw new BadRequestException(`Capability ${capabilityId} not found on agent ${agentId}`);

    if (!agent.roles.includes(context.role)) {
      throw new BadRequestException(`Role ${context.role} not permitted for agent ${agentId}`);
    }

    try {
      const data = await handler();
      return {
        success: true,
        agentId,
        capabilityId,
        data,
        latencyMs: Date.now() - start,
      };
    } catch (error) {
      this.logger.error(`Agent ${agentId} capability ${capabilityId} failed: ${(error as Error).message}`);
      return {
        success: false,
        agentId,
        capabilityId,
        data: null as T,
        latencyMs: Date.now() - start,
        error: (error as Error).message,
      };
    }
  }
}
