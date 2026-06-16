export enum QueueNames {
  MALWARE = 'malware',
  EMAIL = 'email',
  EXPORT = 'export',
  NOTIFICATION = 'notification',
  CERTIFICATION = 'certification',
  SUBSCRIPTION = 'subscription',
  RFQ = 'rfq',
  ESCROW = 'escrow',
  SETTLEMENT = 'settlement',
  DISPUTE = 'dispute',
  ANALYTICS = 'analytics',
  BESTSELLER = 'bestseller',
}

export enum AnalyticsJobTypes {
  FLUSH_BATCH = 'flush-batch',
  PROCESS_DEAD_LETTER = 'process-dead-letter',
  RETRY_FAILED = 'retry-failed',
}

export enum EmailJobTypes {
  SEND_WELCOME_EMAIL = 'SEND_WELCOME_EMAIL',
  SEND_PASSWORD_RESET = 'SEND_PASSWORD_RESET',
  SEND_NOTIFICATION = 'SEND_NOTIFICATION',
  SEND_ORGANIZATION_INVITE = 'SEND_ORGANIZATION_INVITE',
  SEND_VERIFICATION_UPDATE = 'SEND_VERIFICATION_UPDATE',
}

export enum ExportJobTypes {
  GENERATE_CSV = 'GENERATE_CSV',
  GENERATE_PDF = 'GENERATE_PDF',
}

export interface EmailJobData {
  type: EmailJobTypes;
  to: string;
  subject: string;
  template: string;
  context: Record<string, unknown>;
}

export interface ExportJobData {
  type: ExportJobTypes;
  userId: string;
  resource: string;
  filters: Record<string, unknown>;
}

export enum NotificationJobTypes {
  ORGANIZATION_INVITE = 'ORGANIZATION_INVITE',
  VERIFICATION_APPROVED = 'VERIFICATION_APPROVED',
  VERIFICATION_REJECTED = 'VERIFICATION_REJECTED',
  TRUST_SCORE_UPDATED = 'TRUST_SCORE_UPDATED',
  CERTIFICATION_EXPIRED = 'CERTIFICATION_EXPIRED',
  SUBSCRIPTION_RENEWAL = 'SUBSCRIPTION_RENEWAL',
  SEND_NOTIFICATION = 'SEND_NOTIFICATION',
  RETRY_NOTIFICATION = 'RETRY_NOTIFICATION',
  DEAD_LETTER = 'DEAD_LETTER',
}

export interface NotificationJobData {
  type: NotificationJobTypes;
  notificationId: string;
  companyId: string;
  userId?: string;
  channel: string;
  title: string;
  message: string;
  metadata?: Record<string, unknown>;
  attemptCount?: number;
}

export enum CertificationJobTypes {
  CHECK_EXPIRY = 'CHECK_EXPIRY',
  RECALCULATE_TRUST = 'RECALCULATE_TRUST',
}

export interface CertificationJobData {
  type: CertificationJobTypes;
  companyId?: string;
  certificationId?: string;
}

export enum SubscriptionJobTypes {
  CHECK_RENEWAL = 'CHECK_RENEWAL',
  APPLY_GRACE = 'APPLY_GRACE',
  AUTO_EXPIRE = 'AUTO_EXPIRE',
}

export interface SubscriptionJobData {
  type: SubscriptionJobTypes;
  companyId?: string;
  alertPeriod?: string;
}

export enum RfqJobTypes {
  EXPIRE_RFQS = 'EXPIRE_RFQS',
  EXPIRE_CREDIT_PACKS = 'EXPIRE_CREDIT_PACKS',
  EXPIRE_QUOTES = 'EXPIRE_QUOTES',
}

export interface RfqJobData {
  type: RfqJobTypes;
  rfqId?: string;
  companyId?: string;
}

export enum EscrowJobTypes {
  AUTO_RELEASE = 'AUTO_RELEASE',
  EXPIRY_MONITOR = 'EXPIRY_MONITOR',
}

export interface EscrowJobData {
  type: EscrowJobTypes;
  escrowId?: string;
}

export enum SettlementJobTypes {
  PROCESS_SETTLEMENTS = 'PROCESS_SETTLEMENTS',
  PROCESS_RETRIES = 'PROCESS_RETRIES',
}

export interface SettlementJobData {
  type: SettlementJobTypes;
  settlementId?: string;
}

export enum DisputeJobTypes {
  EXPIRE_DISPUTES = 'EXPIRE_DISPUTES',
  EVIDENCE_REMINDER = 'EVIDENCE_REMINDER',
  NEGOTIATION_REMINDER = 'NEGOTIATION_REMINDER',
  ARBITRATION_REMINDER = 'ARBITRATION_REMINDER',
  ADMIN_ARBITRATION = 'ADMIN_ARBITRATION',
  APPEAL_EXPIRY = 'APPEAL_EXPIRY',
  ARBITRATION_SLA_BREACH = 'ARBITRATION_SLA_BREACH',
}

export interface DisputeJobData {
  type: DisputeJobTypes;
  disputeId?: string;
}

export enum BestsellerJobTypes {
  CALCULATE_WEEKLY = 'CALCULATE_WEEKLY',
}

export interface BestsellerJobData {
  type: BestsellerJobTypes;
}
