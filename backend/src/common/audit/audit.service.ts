import { Injectable, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

export type AuditRecord = {
  actorId?: string | null;
  actorType: string;
  actorRole?: string | null;
  action: string;
  resourceType: string;
  resourceId?: string | null;
  patientId?: string | null;
  ip?: string | null;
  userAgent?: string | null;
  metadata?: Record<string, unknown>;
};

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(private readonly prisma: PrismaService) {}

  async record(record: AuditRecord) {
    try {
      await this.prisma.auditLog.create({
        data: {
          actorId: record.actorId || null,
          actorType: record.actorType,
          actorRole: record.actorRole || null,
          action: record.action,
          resourceType: record.resourceType,
          resourceId: record.resourceId || null,
          patientId: record.patientId || null,
          ip: record.ip || null,
          userAgent: record.userAgent || null,
          metadata: (record.metadata || {}) as Prisma.InputJsonValue,
        },
      });
    } catch (error) {
      this.logger.error(
        'No se pudo registrar auditoría',
        error instanceof Error ? error.stack : String(error),
      );
    }
  }

  listPatientAccess(patientId: string) {
    return this.prisma.auditLog.findMany({
      where: { patientId },
      orderBy: { createdAt: 'desc' },
      take: 500,
      select: {
        id: true,
        actorId: true,
        actorType: true,
        actorRole: true,
        action: true,
        resourceType: true,
        resourceId: true,
        patientId: true,
        ip: true,
        userAgent: true,
        metadata: true,
        createdAt: true,
      },
    });
  }
}
