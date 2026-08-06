export interface FederationAgentRef {
  agentId: string;
  agentName: string;
  capabilityId: string;
  capabilityName: string;
  executionOrder: number;
  dependsOn?: string[];
  config?: Record<string, unknown>;
}

export type CollaborationPattern = 'single' | 'parallel' | 'sequential' | 'conditional' | 'nested' | 'coordinator';

export interface CollaborationNode {
  id: string;
  agentId: string;
  capabilityId: string;
  pattern: CollaborationPattern;
  dependsOn?: string[];
  children?: CollaborationNode[];
  condition?: string;
  config?: Record<string, unknown>;
}

export interface FederationContext {
  companyId: string;
  userId?: string;
  role: string;
  payload: Record<string, unknown>;
  metadata?: Record<string, unknown>;
}

export interface FederationExecutionResult {
  collaborationId: string;
  workflowId?: string;
  pattern: CollaborationPattern;
  nodes: FederationNodeResult[];
  totalLatencyMs: number;
  success: boolean;
  error?: string;
}

export interface FederationNodeResult {
  nodeId: string;
  agentId: string;
  capabilityId: string;
  pattern: CollaborationPattern;
  success: boolean;
  latencyMs: number;
  result?: unknown;
  error?: string;
}

export interface AgentMessage {
  id: string;
  fromAgentId: string;
  toAgentId: string;
  type: 'request' | 'response' | 'event' | 'error';
  action: string;
  payload: unknown;
  collaborationId?: string;
  timestamp: Date;
}

export interface FederationAnalytics {
  totalCollaborations: number;
  activeCollaborations: number;
  completedCollaborations: number;
  failedCollaborations: number;
  agentUtilization: { agentId: string; name: string; totalCalls: number; successRate: number; avgLatencyMs: number }[];
  collaborationTypeBreakdown: Record<string, number>;
  avgDurationMs: number;
  p95DurationMs: number;
}
