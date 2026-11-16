import { ForbiddenException, Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../../common/audit/audit.service';
import { STAFF_ROLES } from '../permissions/permissions.constants';
import { ProductEventDto } from './dto/product-event.dto';

const PRODUCT_RESOURCE = 'PRODUCT_ANALYTICS';
const MAX_METADATA_KEYS = 12;
const MAX_EVENTS_TO_AGGREGATE = 20_000;

const FEATURE_CATALOG = [
  { key: 'dashboard', label: 'Dashboard principal' },
  { key: 'patients', label: 'Pacientes' },
  { key: 'consultations', label: 'Consultas' },
  { key: 'diet', label: 'Dietas' },
  { key: 'recipes', label: 'Recetas' },
  { key: 'resources', label: 'Recursos' },
  { key: 'appointments', label: 'Citas' },
  { key: 'patient-portal', label: 'Portal del paciente' },
  { key: 'copilot', label: 'Copiloto IA' },
  { key: 'deliverables', label: 'Entregables' },
];

type SafeValue = string | number | boolean | null;

const isSafeValue = (value: unknown): value is SafeValue =>
  value === null ||
  typeof value === 'string' ||
  typeof value === 'number' ||
  typeof value === 'boolean';

const sanitizePath = (value?: string) => {
  if (!value) return '/';
  const path = value.split('?')[0].slice(0, 180);
  return path
    .split('/')
    .map((segment, index) => {
      if (!segment) return '';
      if (/^[0-9a-f]{8,}$/i.test(segment) || /^\d+$/.test(segment)) {
        return ':id';
      }
      if (index > 0 && (path.startsWith('/portal/') || path.startsWith('/verify-email/'))) {
        return ':token';
      }
      return segment.replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 50);
    })
    .join('/') || '/';
};

const sanitizeMetadata = (metadata?: ProductEventDto['metadata']) => {
  if (!metadata) return {};
  return Object.entries(metadata)
    .filter(([key, value]) =>
      /^[a-zA-Z][a-zA-Z0-9_]{0,40}$/.test(key) && isSafeValue(value),
    )
    .slice(0, MAX_METADATA_KEYS)
    .reduce<Record<string, SafeValue>>((result, [key, value]) => {
      result[key] = value;
      return result;
    }, {});
};

@Injectable()
export class ProductAnalyticsService {
  private readonly logger = new Logger(ProductAnalyticsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  async recordEvent(
    dto: ProductEventDto,
    actor?: { id?: string; role?: string } | null,
  ) {
    const path = sanitizePath(dto.path);
    const eventName = dto.eventName.trim().toLowerCase().replace(/[^a-z0-9_.-]/g, '_');
    const anonymousId = dto.anonymousId?.replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 120);
    const metadata = {
      eventName,
      path,
      durationMs: dto.durationMs ?? null,
      anonymousId: anonymousId || null,
      ...sanitizeMetadata(dto.metadata),
    };

    await this.auditService.record({
      actorId: actor?.id || null,
      actorType: actor?.id ? 'ACCOUNT' : 'GUEST',
      actorRole: actor?.role || null,
      action: eventName,
      resourceType: PRODUCT_RESOURCE,
      resourceId: path,
      metadata,
    });

    void this.forwardToPostHog(eventName, actor?.id || anonymousId || 'anonymous', {
      path,
      duration_ms: dto.durationMs ?? null,
      role: actor?.role || null,
    });

    return { accepted: true };
  }

  async getAdminAnalytics(role?: string, days = 30) {
    if (!role || !STAFF_ROLES.includes(role as (typeof STAFF_ROLES)[number])) {
      throw new ForbiddenException('No tienes permisos para acceder a esta sección');
    }

    const safeDays = Math.min(Math.max(Number(days) || 30, 1), 90);
    const since = new Date();
    since.setDate(since.getDate() - safeDays);

    const events = await this.prisma.auditLog.findMany({
      where: { resourceType: PRODUCT_RESOURCE, createdAt: { gte: since } },
      orderBy: { createdAt: 'desc' },
      take: MAX_EVENTS_TO_AGGREGATE,
      select: {
        id: true,
        actorId: true,
        actorRole: true,
        action: true,
        resourceId: true,
        metadata: true,
        createdAt: true,
      },
    });

    const actorIds = [...new Set(events.map((event) => event.actorId).filter(Boolean))] as string[];
    const accounts = await this.prisma.account.findMany({
      where: { id: { in: actorIds } },
      select: { id: true, email: true, role: true, nutritionist: { select: { fullName: true } } },
    });
    const accountMap = new Map(accounts.map((account) => [account.id, account]));
    const routeCounts = new Map<string, number>();
    const eventCounts = new Map<string, number>();
    const featureCounts = new Map<string, number>();
    const dailyCounts = new Map<string, number>();
    const activeActors = new Set<string>();
    const guestSessions = new Set<string>();
    let totalDurationMs = 0;
    let durationEvents = 0;

    for (const event of events) {
      const metadata = (event.metadata && typeof event.metadata === 'object' && !Array.isArray(event.metadata)
        ? event.metadata
        : {}) as Record<string, unknown>;
      const path = typeof metadata.path === 'string' ? metadata.path : event.resourceId || '/';
      const eventName = typeof metadata.eventName === 'string' ? metadata.eventName : event.action;
      const duration = typeof metadata.durationMs === 'number' ? metadata.durationMs : 0;
      const anonymousId = typeof metadata.anonymousId === 'string' ? metadata.anonymousId : null;
      const day = event.createdAt.toISOString().slice(0, 10);
      routeCounts.set(path, (routeCounts.get(path) || 0) + 1);
      eventCounts.set(eventName, (eventCounts.get(eventName) || 0) + 1);
      dailyCounts.set(day, (dailyCounts.get(day) || 0) + 1);
      if (event.actorId) activeActors.add(event.actorId);
      if (anonymousId) guestSessions.add(anonymousId);
      if (duration > 0) {
        totalDurationMs += duration;
        durationEvents += 1;
      }
      const feature = path.split('/')[2] || path.split('/')[1] || 'public';
      featureCounts.set(feature, (featureCounts.get(feature) || 0) + 1);
    }

    const recentActivity = events.slice(0, 25).map((event) => {
      const account = event.actorId ? accountMap.get(event.actorId) : null;
      const metadata = (event.metadata && typeof event.metadata === 'object' && !Array.isArray(event.metadata)
        ? event.metadata
        : {}) as Record<string, unknown>;
      return {
        id: event.id,
        eventName: typeof metadata.eventName === 'string' ? metadata.eventName : event.action,
        path: typeof metadata.path === 'string' ? metadata.path : event.resourceId,
        actor: account
          ? { id: account.id, email: account.email, name: account.nutritionist?.fullName || account.email, role: account.role }
          : { id: null, email: null, name: 'Sesión invitada', role: event.actorRole },
        createdAt: event.createdAt,
      };
    });

    return {
      range: { days: safeDays, since },
      overview: {
        totalEvents: events.length,
        activeUsers: activeActors.size,
        guestSessions: guestSessions.size,
        averageSessionMs: durationEvents ? Math.round(totalDurationMs / durationEvents) : 0,
      },
      topRoutes: this.sortedCounts(routeCounts),
      topEvents: this.sortedCounts(eventCounts),
      dailyActivity: this.sortedCounts(dailyCounts),
      featureUsage: this.sortedCounts(featureCounts),
      unusedFeatures: FEATURE_CATALOG.filter((feature) => !featureCounts.has(feature.key)),
      recentActivity,
    };
  }

  private sortedCounts(values: Map<string, number>) {
    return [...values.entries()]
      .map(([key, count]) => ({ key, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 25);
  }

  private async forwardToPostHog(event: string, distinctId: string, properties: Record<string, unknown>) {
    const apiKey = process.env.POSTHOG_API_KEY;
    const host = process.env.POSTHOG_HOST;
    if (!apiKey || !host) return;

    try {
      await fetch(`${host.replace(/\/$/, '')}/capture/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ api_key: apiKey, event, distinct_id: distinctId, properties }),
      });
    } catch (error) {
      this.logger.warn(`PostHog no disponible: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}
