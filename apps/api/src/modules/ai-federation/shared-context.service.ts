import { Injectable, Logger } from '@nestjs/common';
import { AiContextEngine } from '../ai-orchestrator/ai-context-engine.service';
import { FederationContext } from './interfaces/federation.interfaces';

@Injectable()
export class SharedContextService {
  private readonly logger = new Logger(SharedContextService.name);

  constructor(private readonly contextEngine: AiContextEngine) {}

  async buildFederatedContext(context: FederationContext): Promise<Record<string, unknown>> {
    const include = this.determineContextIncludes(context.payload, context.role);
    const ctx = await this.contextEngine.getAggregatedContext({
      companyId: context.companyId,
      userId: context.userId,
      include,
      productId: (context.payload?.productId as string) || undefined,
    });

    return {
      ...ctx,
      federation: {
        collaborationId: context.metadata?.collaborationId,
        workflowId: context.metadata?.workflowId,
        role: context.role,
        timestamp: new Date().toISOString(),
      },
    };
  }

  mergeContexts(contexts: Record<string, unknown>[]): Record<string, unknown> {
    const merged: Record<string, unknown> = {};
    for (const ctx of contexts) {
      Object.assign(merged, ctx);
    }
    return merged;
  }

  private determineContextIncludes(payload: Record<string, unknown>, role: string): string[] {
    const includes = new Set<string>(['company', 'marketplace']);

    if (payload?.productId || payload?.productIds) includes.add('product');
    if ((payload?.userId || payload?.userIds) && role) includes.add('user');
    if (role === 'seller' || role === 'buyer' || payload?.planId) includes.add('membership');
    if (payload?.includeBuyer || role === 'buyer') includes.add('user');
    if (payload?.includeSeller || role === 'seller') includes.add('company');
    if (payload?.includeAdmin || role === 'admin') {
      includes.add('membership');
    }

    return Array.from(includes);
  }
}
