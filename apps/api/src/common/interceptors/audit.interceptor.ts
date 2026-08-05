import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable, tap } from 'rxjs';
import { AuditLogService } from '../../modules/audit-log/audit-log.service';
import { AUDIT_LOG_METADATA, AuditLogOptions } from '../decorators/audit-log.decorator';
import { logger } from '../logger';

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(
    private readonly auditLogService: AuditLogService,
    private readonly reflector: Reflector,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const auditOptions = this.reflector.get<AuditLogOptions>(AUDIT_LOG_METADATA, context.getHandler());
    if (!auditOptions) return next.handle();

    const request = context.switchToHttp().getRequest();
    const startTime = Date.now();

    return next.handle().pipe(
      tap({
        next: (data: unknown) => {
          context.switchToHttp().getResponse();
          this.auditLogService.create({
            action: auditOptions.action,
            resource: auditOptions.resource,
            outcome: 'success',
            userId: request.user?.sub || request.user?.id,
            companyId: request.user?.companyId,
            sessionId: request.user?.sessionId,
            ipAddress: request.ip,
            userAgent: request.headers?.['user-agent'],
            correlationId: request.correlationId,
            newValue: data ? { id: (data as any)?.id, ...((data as any)?.data ? {} : {}) } : undefined,
            metadata: { durationMs: Date.now() - startTime },
          }).catch((err) => logger.warn({ err, action: auditOptions.action, resource: auditOptions.resource }, 'Audit log write failed on success'));
        },
        error: (error: Error) => {
          this.auditLogService.create({
            action: auditOptions.action,
            resource: auditOptions.resource,
            outcome: 'failure',
            userId: request.user?.sub || request.user?.id,
            companyId: request.user?.companyId,
            sessionId: request.user?.sessionId,
            ipAddress: request.ip,
            userAgent: request.headers?.['user-agent'],
            correlationId: request.correlationId,
            metadata: { error: error.message, durationMs: Date.now() - startTime },
          }).catch((err) => logger.warn({ err, action: auditOptions.action, resource: auditOptions.resource }, 'Audit log write failed on error'));
        },
      }),
    );
  }
}
