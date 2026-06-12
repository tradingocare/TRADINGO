export enum QueueNames {
  EMAIL = 'email',
  EXPORT = 'export',
  NOTIFICATION = 'notification',
  CERTIFICATION = 'certification',
  SUBSCRIPTION = 'subscription',
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
}

export interface NotificationJobData {
  type: NotificationJobTypes;
  userId: string;
  title: string;
  message: string;
  metadata?: Record<string, unknown>;
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
