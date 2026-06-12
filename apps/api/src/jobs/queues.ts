export enum QueueNames {
  EMAIL = 'email',
  EXPORT = 'export',
  NOTIFICATION = 'notification',
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
}

export interface NotificationJobData {
  type: NotificationJobTypes;
  userId: string;
  title: string;
  message: string;
  metadata?: Record<string, unknown>;
}
