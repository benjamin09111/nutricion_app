import { SetMetadata } from '@nestjs/common';

export const AUDIT_METADATA_KEY = 'audit:metadata';

export type AuditMetadata = {
  action: string;
  resourceType: string;
};

export const Audit = (metadata: AuditMetadata) =>
  SetMetadata(AUDIT_METADATA_KEY, metadata);
