export interface TradeAgentCapability {
  id: string;
  name: string;
  description: string;
  dataSources: string[];
  executionType: 'direct' | 'orchestrator' | 'runtime';
  tags: string[];
}

export interface TradeAgentMetadata {
  id: string;
  name: string;
  description: string;
  version: string;
  roles: string[];
  basePath: string;
  capabilities: TradeAgentCapability[];
  dependencies: string[];
}

export interface TradeAgentContext {
  companyId?: string;
  userId?: string;
  role: string;
}

export interface TradeAgentExecutionResult<T = unknown> {
  success: boolean;
  agentId: string;
  capabilityId: string;
  data: T;
  latencyMs: number;
  error?: string;
}
