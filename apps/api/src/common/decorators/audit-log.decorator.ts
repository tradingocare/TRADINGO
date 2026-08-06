import { SetMetadata } from '@nestjs/common';

export const AUDIT_LOG_METADATA = 'audit_log_metadata';

export interface AuditLogOptions {
  action: string;
  resource: string;
}

export const AuditLog = (options: AuditLogOptions) => SetMetadata(AUDIT_LOG_METADATA, options);
