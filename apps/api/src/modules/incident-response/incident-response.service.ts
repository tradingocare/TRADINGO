import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { LaunchService } from '../launch/launch.service';
import { IncidentSeverity } from '@prisma/client';

interface SecurityEventPayload {
  userId?: string;
  action: string;
  resource: string;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
}

interface ClassifierRule {
  actionPrefix: string;
  severity: IncidentSeverity;
  autoRespond: boolean;
  notifyAdmin: boolean;
}

const CLASSIFIER_RULES: ClassifierRule[] = [
  { actionPrefix: 'SECURITY_LOGIN_FAILURE', severity: 'MEDIUM', autoRespond: false, notifyAdmin: false },
  { actionPrefix: 'SECURITY_PRIVILEGE_ESCALATION', severity: 'HIGH', autoRespond: false, notifyAdmin: true },
  { actionPrefix: 'SECURITY_PROMPT_INJECTION', severity: 'HIGH', autoRespond: false, notifyAdmin: true },
  { actionPrefix: 'SECURITY_WEBSOCKET_REJECTED', severity: 'LOW', autoRespond: false, notifyAdmin: false },
  { actionPrefix: 'SECURITY_RATE_LIMIT', severity: 'LOW', autoRespond: false, notifyAdmin: false },
];

@Injectable()
export class IncidentResponseService {
  private readonly logger = new Logger(IncidentResponseService.name);
  private readonly severityOrder: Record<string, number> = { LOW: 0, MEDIUM: 1, HIGH: 2, CRITICAL: 3 };

  constructor(private readonly launch: LaunchService) {}

  classify(action: string): { severity: IncidentSeverity; autoRespond: boolean; notifyAdmin: boolean } {
    const match = CLASSIFIER_RULES.find((r) => action.startsWith(r.actionPrefix));
    if (match) return match;
    return { severity: 'MEDIUM', autoRespond: false, notifyAdmin: false };
  }

  async createIncident(payload: SecurityEventPayload): Promise<void> {
    const { severity, notifyAdmin } = this.classify(payload.action);
    const title = `${severity}: ${payload.action.replace(/^SECURITY_/, '').replace(/_/g, ' ')}`;
    const description = `${payload.action} on ${payload.resource}`;

    try {
      await this.launch.createIncident({
        title,
        description,
        severity,
        impactedServices: [payload.resource],
      }, 'system');
      this.logger.log(`Incident created: ${title} (${severity})`);
    } catch (err) {
      this.logger.error('Failed to create incident', err);
    }
  }

  @OnEvent('security.login.failed')
  async handleLoginFailed(payload: SecurityEventPayload) {
    await this.createIncident(payload);
  }

  @OnEvent('security.websocket.rejected')
  async handleWebsocketRejected(payload: SecurityEventPayload) {
    await this.createIncident(payload);
  }

  @OnEvent('security.prompt.injection')
  async handlePromptInjection(payload: SecurityEventPayload) {
    await this.createIncident(payload);
  }

  @OnEvent('security.privilege.escalation')
  async handlePrivilegeEscalation(payload: SecurityEventPayload) {
    await this.createIncident(payload);
  }

  async getIncidents(page = 1, limit = 20, status?: string, severity?: string) {
    return this.launch.getIncidents({ page, limit, status: status as any, severity: severity as any });
  }

  async getSummary() {
    const [open, critical, high, medium, low, autoResolved] = await Promise.all([
      this.countByStatus('DETECTED'),
      this.countBySeverity('CRITICAL'),
      this.countBySeverity('HIGH'),
      this.countBySeverity('MEDIUM'),
      this.countBySeverity('LOW'),
      this.launch.getIncidents({ page: 1, limit: 1 }), 
    ]);

    const all = await this.launch.getIncidents({ page: 1, limit: 10000 });

    const severityDist = { CRITICAL: 0, HIGH: 0, MEDIUM: 0, LOW: 0 };
    const sourceDist: Record<string, number> = {};
    let autoCount = 0;

    for (const item of all.data) {
      const sev = item.severity as string;
      if (sev in severityDist) severityDist[sev as keyof typeof severityDist]++;
      if (item.detectionSource) {
        sourceDist[item.detectionSource] = (sourceDist[item.detectionSource] || 0) + 1;
      }
      if (item.autoResolved) autoCount++;
    }

    return {
      open: (all.data as any[]).filter((i: any) => i.status === 'DETECTED' || i.status === 'INVESTIGATING').length,
      resolved: (all.data as any[]).filter((i: any) => i.status === 'RESOLVED').length,
      severityDistribution: severityDist,
      sourceDistribution: sourceDist,
      autoResolved: autoCount,
      total: all.meta.total,
    };
  }

  private async countByStatus(status: string): Promise<number> {
    const result = await this.launch.getIncidents({ page: 1, limit: 1, status: status as any });
    return result.meta.total;
  }

  private async countBySeverity(severity: string): Promise<number> {
    const result = await this.launch.getIncidents({ page: 1, limit: 1, severity: severity as any });
    return result.meta.total;
  }
}
