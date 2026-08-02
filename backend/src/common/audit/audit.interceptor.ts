import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { catchError, tap, throwError } from 'rxjs';
import { AuditService } from './audit.service';
import { AUDIT_METADATA_KEY, AuditMetadata } from './audit.decorator';

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(
    private readonly reflector: Reflector,
    private readonly auditService: AuditService,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler) {
    const metadata = this.reflector.getAllAndOverride<AuditMetadata>(
      AUDIT_METADATA_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (!metadata) return next.handle();

    const request = context.switchToHttp().getRequest();
    const actor = request.user;
    const portalSession = request.portalSession;
    const resourceId =
      request.params?.id ||
      request.params?.patientId ||
      portalSession?.patientId ||
      null;
    const patientId =
      request.params?.patientId || portalSession?.patientId || resourceId;
    const record = {
      ...metadata,
      actorId: actor?.id || null,
      actorType: actor
        ? 'ACCOUNT'
        : portalSession
          ? 'PATIENT_PORTAL'
          : 'SYSTEM',
      actorRole: actor?.role || null,
      resourceId,
      patientId,
      ip: request.ip || request.socket?.remoteAddress || null,
      userAgent: request.get?.('user-agent') || null,
      metadata: {
        route: request.route?.path || request.path,
        method: request.method,
      },
    };

    return next.handle().pipe(
      tap((response) => {
        void this.auditService.record({
          ...record,
          metadata: {
            ...record.metadata,
            resultCount: Array.isArray(response?.data)
              ? response.data.length
              : undefined,
          },
        });
      }),
      catchError((error: unknown) => {
        void this.auditService.record({
          ...record,
          metadata: { ...record.metadata, outcome: 'ERROR' },
        });
        return throwError(() => error);
      }),
    );
  }
}
