export interface FederationAgentSummary {
  totalAgents: number;
  totalCapabilities: number;
  byRole: Record<string, number>;
}

export interface FederationCapabilityEntry {
  agentId: string;
  agentName: string;
  capabilityId: string;
  capabilityName: string;
}

export interface WorkflowDefinition {
  id: string;
  name: string;
  description: string;
  nodes: { id: string; agentId: string; capabilityId: string; pattern: string; dependsOn?: string[] }[];
}

export interface FederationNodeResult {
  nodeId: string;
  agentId: string;
  capabilityId: string;
  pattern: string;
  success: boolean;
  latencyMs: number;
  result?: unknown;
  error?: string;
}

export interface FederationExecutionResult {
  collaborationId: string;
  workflowId?: string;
  pattern: string;
  nodes: FederationNodeResult[];
  totalLatencyMs: number;
  success: boolean;
  error?: string;
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

export interface CollaborationHistoryEntry {
  collaborationId: string;
  workflowId?: string;
  pattern: string;
  startedAt: string;
  completedAt?: string;
  durationMs: number;
  success: boolean;
  nodeCount: number;
  agentIds: string[];
  error?: string;
}

export interface FederationGraph {
  nodes: { id: string; name: string; group: string }[];
  links: { source: string; target: string }[];
}

export interface AgentUtilizationEntry {
  agentId: string;
  name: string;
  totalCalls: number;
  successRate: number;
  avgLatencyMs: number;
}

const BASE = '/ai-federation';
const ADMIN_BASE = '/admin/ai-federation';

export async function getRegisteredAgents(): Promise<FederationAgentSummary> {
  const res = await fetch(BASE + '/agents'); if (!res.ok) throw new Error('Failed to fetch agents');
  return res.json();
}

export async function getCapabilities(): Promise<FederationCapabilityEntry[]> {
  const res = await fetch(BASE + '/capabilities'); if (!res.ok) throw new Error('Failed to fetch capabilities');
  return res.json();
}

export async function getWorkflows(): Promise<WorkflowDefinition[]> {
  const res = await fetch(BASE + '/workflows'); if (!res.ok) throw new Error('Failed to fetch workflows');
  return res.json();
}

export async function executeCollaboration(pattern: string, nodes: unknown[], context: { companyId: string; role: string; payload: Record<string, unknown> }): Promise<FederationExecutionResult> {
  const res = await fetch(BASE + '/execute', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ pattern, nodes, context }) });
  if (!res.ok) throw new Error('Failed to execute collaboration');
  return res.json();
}

export async function executeWorkflow(workflowId: string, context: { companyId: string; role: string; payload: Record<string, unknown> }): Promise<FederationExecutionResult> {
  const res = await fetch(BASE + '/workflow/' + workflowId, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(context) });
  if (!res.ok) throw new Error('Failed to execute workflow');
  return res.json();
}

export async function smartExecute(goal: string, context: { companyId: string; role: string; payload: Record<string, unknown> }): Promise<FederationExecutionResult> {
  const res = await fetch(BASE + '/smart', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ goal, context }) });
  if (!res.ok) throw new Error('Failed to smart execute');
  return res.json();
}

export async function getFederationAnalytics(): Promise<FederationAnalytics> {
  const res = await fetch(BASE + '/analytics'); if (!res.ok) throw new Error('Failed to fetch analytics');
  return res.json();
}

export async function getCollaborationHistory(limit = 50, offset = 0): Promise<{ data: CollaborationHistoryEntry[]; total: number }> {
  const res = await fetch(BASE + '/history?limit=' + limit + '&offset=' + offset); if (!res.ok) throw new Error('Failed to fetch history');
  return res.json();
}

export async function getCollaborationGraph(): Promise<FederationGraph> {
  const res = await fetch(BASE + '/graph'); if (!res.ok) throw new Error('Failed to fetch graph');
  return res.json();
}

export async function getAgentUtilization(): Promise<AgentUtilizationEntry[]> {
  const res = await fetch(BASE + '/utilization'); if (!res.ok) throw new Error('Failed to fetch utilization');
  return res.json();
}

export async function getActiveCollaborations(): Promise<string[]> {
  const res = await fetch(BASE + '/active'); if (!res.ok) throw new Error('Failed to fetch active');
  return res.json();
}

export async function cancelCollaboration(collaborationId: string): Promise<{ cancelled: boolean }> {
  const res = await fetch(BASE + '/cancel/' + collaborationId, { method: 'DELETE' }); if (!res.ok) throw new Error('Failed to cancel');
  return res.json();
}

export async function getFederationDashboard(): Promise<{
  analytics: FederationAnalytics;
  agents: FederationAgentSummary;
  workflows: WorkflowDefinition[];
  active: string[];
  graph: FederationGraph;
}> {
  const res = await fetch(ADMIN_BASE + '/dashboard'); if (!res.ok) throw new Error('Failed to fetch dashboard');
  return res.json();
}
