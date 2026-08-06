import { Injectable, Logger } from '@nestjs/common';
import { CollaborationEngine } from './collaboration-engine';
import { CollaborationNode, FederationContext, FederationExecutionResult } from './interfaces/federation.interfaces';

const BUYER_RFQ_WORKFLOW: CollaborationNode[] = [
  { id: 'rfq-analysis', agentId: 'buyer', capabilityId: 'rfq-assistant', pattern: 'single' },
  { id: 'supplier-analysis', agentId: 'seller', capabilityId: 'supplier-intelligence', pattern: 'single', dependsOn: ['rfq-analysis'] },
  { id: 'negotiation-intel', agentId: 'seller', capabilityId: 'negotiation-advisor', pattern: 'single', dependsOn: ['supplier-analysis'] },
  { id: 'marketplace-insight', agentId: 'founder', capabilityId: 'marketplace-intelligence', pattern: 'single', dependsOn: ['negotiation-intel'] },
];

const PRODUCT_PUBLISHED_WORKFLOW: CollaborationNode[] = [
  { id: 'seller-advisor', agentId: 'seller', capabilityId: 'product-intelligence', pattern: 'single' },
  { id: 'advertising-advisor', agentId: 'seller', capabilityId: 'pricing-advisor', pattern: 'single', dependsOn: ['seller-advisor'] },
  { id: 'catalog-intel', agentId: 'admin', capabilityId: 'platform-growth', pattern: 'single', dependsOn: ['advertising-advisor'] },
  { id: 'business-insight', agentId: 'founder', capabilityId: 'marketplace-intelligence', pattern: 'single', dependsOn: ['catalog-intel'] },
];

const TRADESERV_LEAD_WORKFLOW: CollaborationNode[] = [
  { id: 'lead-analysis', agentId: 'buyer', capabilityId: 'supplier-intelligence', pattern: 'single' },
  { id: 'marketplace-match', agentId: 'admin', capabilityId: 'dashboard-copilot', pattern: 'single', dependsOn: ['lead-analysis'] },
  { id: 'community-recommend', agentId: 'founder', capabilityId: 'executive-insights', pattern: 'single', dependsOn: ['marketplace-match'] },
];

const ENTERPRISE_INTELLIGENCE_WORKFLOW: CollaborationNode[] = [
  { id: 'health-check', agentId: 'enterprise-intelligence', capabilityId: 'health-index', pattern: 'single' },
  { id: 'supply-demand-check', agentId: 'enterprise-intelligence', capabilityId: 'supply-demand', pattern: 'parallel' },
  { id: 'opportunity-scan', agentId: 'enterprise-intelligence', capabilityId: 'opportunities', pattern: 'parallel' },
  { id: 'risk-scan', agentId: 'enterprise-intelligence', capabilityId: 'risks', pattern: 'parallel' },
  { id: 'prediction-check', agentId: 'enterprise-intelligence', capabilityId: 'predictions', pattern: 'parallel' },
  {
    id: 'enterprise-brief',
    agentId: 'founder',
    capabilityId: 'executive-insights',
    pattern: 'sequential',
    dependsOn: ['health-check', 'supply-demand-check', 'opportunity-scan', 'risk-scan', 'prediction-check'],
    children: [
      { id: 'health', agentId: 'enterprise-intelligence', capabilityId: 'health-index', pattern: 'single' },
      { id: 'opportunities', agentId: 'enterprise-intelligence', capabilityId: 'opportunities', pattern: 'single' },
      { id: 'risks', agentId: 'enterprise-intelligence', capabilityId: 'risks', pattern: 'single' },
      { id: 'predictions', agentId: 'enterprise-intelligence', capabilityId: 'predictions', pattern: 'single' },
    ],
  },
];

const PLATFORM_HEALTH_WORKFLOW: CollaborationNode[] = [
  { id: 'revenue-check', agentId: 'admin', capabilityId: 'revenue-analytics', pattern: 'single' },
  { id: 'fraud-check', agentId: 'admin', capabilityId: 'fraud-intelligence', pattern: 'parallel' },
  { id: 'user-activity-check', agentId: 'admin', capabilityId: 'user-activity', pattern: 'parallel' },
  { id: 'system-health-check', agentId: 'admin', capabilityId: 'system-health', pattern: 'parallel' },
  {
    id: 'executive-brief',
    agentId: 'founder',
    capabilityId: 'executive-insights',
    pattern: 'sequential',
    dependsOn: ['revenue-check', 'fraud-check', 'user-activity-check', 'system-health-check'],
    children: [
      { id: 'revenue', agentId: 'admin', capabilityId: 'revenue-analytics', pattern: 'single' },
      { id: 'fraud', agentId: 'admin', capabilityId: 'fraud-intelligence', pattern: 'single' },
      { id: 'activity', agentId: 'admin', capabilityId: 'user-activity', pattern: 'single' },
      { id: 'health', agentId: 'admin', capabilityId: 'system-health', pattern: 'single' },
    ],
  },
];

export interface WorkflowDefinition {
  id: string;
  name: string;
  description: string;
  nodes: CollaborationNode[];
}

@Injectable()
export class CrossAgentWorkflowService {
  private readonly logger = new Logger(CrossAgentWorkflowService.name);

  private readonly workflows = new Map<string, WorkflowDefinition>();

  constructor(private readonly engine: CollaborationEngine) {
    this.registerDefaults();
  }

  private registerDefaults(): void {
    this.workflows.set('buyer-rfq', {
      id: 'buyer-rfq',
      name: 'Buyer RFQ Intelligence',
      description: 'Analyze RFQ → Find Suppliers → Negotiation Intel → Marketplace Insight',
      nodes: BUYER_RFQ_WORKFLOW,
    });
    this.workflows.set('product-published', {
      id: 'product-published',
      name: 'Product Published Intelligence',
      description: 'Product Analysis → Pricing → Catalog Insight → Business Intelligence',
      nodes: PRODUCT_PUBLISHED_WORKFLOW,
    });
    this.workflows.set('tradeserv-lead', {
      id: 'tradeserv-lead',
      name: 'TradeServ Lead Intelligence',
      description: 'Lead Analysis → Market Match → Community Recommendations',
      nodes: TRADESERV_LEAD_WORKFLOW,
    });
    this.workflows.set('platform-health', {
      id: 'platform-health',
      name: 'Platform Health Report',
      description: 'Revenue + Fraud + Activity + Health → Executive Brief',
      nodes: PLATFORM_HEALTH_WORKFLOW,
    });
    this.workflows.set('enterprise-intelligence', {
      id: 'enterprise-intelligence',
      name: 'Enterprise Intelligence Report',
      description: 'Health Index + Supply-Demand + Opportunities + Risks + Predictions → Enterprise Brief',
      nodes: ENTERPRISE_INTELLIGENCE_WORKFLOW,
    });
  }

  getWorkflows(): WorkflowDefinition[] {
    return Array.from(this.workflows.values());
  }

  getWorkflow(id: string): WorkflowDefinition | undefined {
    return this.workflows.get(id);
  }

  registerWorkflow(id: string, name: string, description: string, nodes: CollaborationNode[]): void {
    this.workflows.set(id, { id, name, description, nodes });
  }

  async executeWorkflow(
    workflowId: string,
    context: FederationContext,
  ): Promise<FederationExecutionResult> {
    const workflow = this.workflows.get(workflowId);
    if (!workflow) {
      throw new Error(`Workflow '${workflowId}' not found`);
    }
    context = { ...context, metadata: { ...context.metadata, workflowId } };

    this.logger.log(`Executing workflow '${workflowId}': ${workflow.name}`);
    return this.engine.executeWorkflow('sequential', workflow.nodes, context);
  }
}
