import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateLandingLeadDto } from './dto/create-landing-lead.dto';
import { CreateLandingEventDto } from './dto/create-landing-event.dto';
import { UpdateLandingLeadDto } from './dto/update-landing-lead.dto';
import { MailService } from '../mail/mail.service';

@Injectable()
export class LandingService {
  private readonly logger = new Logger(LandingService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly mailService: MailService,
  ) {}

  /**
   * Tracks an event on the landing page (views, CTA clicks, interactions).
   */
  async trackEvent(
    dto: CreateLandingEventDto,
    userAgent?: string,
    referrer?: string,
  ) {
    try {
      const event = await this.prisma.landingEvent.create({
        data: {
          sessionId: dto.sessionId,
          eventType: dto.eventType,
          pagePath: dto.pagePath || '/',
          metadata: dto.metadata || {},
          referrer: dto.referrer || referrer || null,
          userAgent: userAgent || null,
        },
      });

      return { success: true, eventId: event.id };
    } catch (error) {
      this.logger.error('Error tracking landing event:', error);
      // Graceful return so client analytics failure never disrupts UX
      return { success: false, error: 'Failed to record event' };
    }
  }

  /**
   * Captures a qualified lead from the landing page.
   */
  async createLead(dto: CreateLandingLeadDto, sessionId?: string) {
    const cleanEmail = dto.email.trim().toLowerCase();
    const cleanName = dto.fullName.trim();

    const existing = await this.prisma.landingLead.findFirst({
      where: { email: cleanEmail },
    });

    let lead;
    if (existing) {
      lead = await this.prisma.landingLead.update({
        where: { id: existing.id },
        data: {
          fullName: cleanName,
          practiceArea: dto.practiceArea,
          phone: dto.phone?.trim() || existing.phone,
          notes: dto.notes ? `${existing.notes ? existing.notes + ' | ' : ''}${dto.notes}` : existing.notes,
          source: dto.source || existing.source,
        },
      });
    } else {
      lead = await this.prisma.landingLead.create({
        data: {
          fullName: cleanName,
          email: cleanEmail,
          practiceArea: dto.practiceArea,
          phone: dto.phone?.trim() || null,
          source: dto.source || 'jump_chile',
          notes: dto.notes || null,
          status: 'NUEVO',
        },
      });
    }

    // Record submission event
    if (sessionId) {
      await this.trackEvent({
        sessionId,
        eventType: 'LEAD_SUBMIT',
        metadata: {
          leadId: lead.id,
          practiceArea: lead.practiceArea,
        },
      });
    }

    // Async alert email to team (non-blocking)
    this.mailService
      .sendRegistrationAlert(
        lead.fullName,
        lead.email,
        `Nuevo Lead calificado desde Landing (Jump Chile).\nÁrea: ${lead.practiceArea}\nTeléfono: ${lead.phone || 'No especificado'}\nID: ${lead.id}`,
      )
      .catch((err) => {
        this.logger.warn('Could not send new lead email alert:', err);
      });

    return {
      success: true,
      message: '¡Gracias! Te contactaremos por email para enviarte tu acceso exclusivo al Beta de NutriNet.',
      leadId: lead.id,
    };
  }

  /**
   * Retrieves aggregated metrics and analytics for the admin dashboard.
   */
  async getAdminMetrics(days: number = 30) {
    const safeDays = Math.min(Math.max(days, 1), 90);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - safeDays);
    startDate.setHours(0, 0, 0, 0);

    const [
      totalPageViews,
      allEvents,
      totalLeads,
      leadsByAreaGroup,
      leadsByStatusGroup,
      recentLeads,
      recentEvents,
    ] = await Promise.all([
      // Total page views in timeframe
      this.prisma.landingEvent.count({
        where: {
          eventType: 'PAGE_VIEW',
          createdAt: { gte: startDate },
        },
      }),

      // Events to calculate unique visitors & CTA clicks
      this.prisma.landingEvent.findMany({
        where: { createdAt: { gte: startDate } },
        select: {
          sessionId: true,
          eventType: true,
          createdAt: true,
        },
      }),

      // Total leads
      this.prisma.landingLead.count({
        where: { createdAt: { gte: startDate } },
      }),

      // Breakdown by practice area
      this.prisma.landingLead.groupBy({
        by: ['practiceArea'],
        where: { createdAt: { gte: startDate } },
        _count: { id: true },
      }),

      // Breakdown by status
      this.prisma.landingLead.groupBy({
        by: ['status'],
        where: { createdAt: { gte: startDate } },
        _count: { id: true },
      }),

      // Recent leads list
      this.prisma.landingLead.findMany({
        take: 8,
        orderBy: { createdAt: 'desc' },
      }),

      // Recent events feed
      this.prisma.landingEvent.findMany({
        take: 12,
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    // Unique visitors (sessions)
    const uniqueSessionIds = new Set(allEvents.map((e) => e.sessionId));
    const uniqueVisitors = uniqueSessionIds.size;

    // CTA clicks
    const totalHeroCtaClicks = allEvents.filter(
      (e) => e.eventType === 'HERO_CTA_CLICK',
    ).length;

    // Click Through Rate (CTR %)
    const ctr =
      uniqueVisitors > 0
        ? Number(((totalHeroCtaClicks / uniqueVisitors) * 100).toFixed(1))
        : 0;

    // Conversion Rate (%) = leads / unique visitors
    const conversionRate =
      uniqueVisitors > 0
        ? Number(((totalLeads / uniqueVisitors) * 100).toFixed(1))
        : 0;

    // Format practice area breakdown with labels and percentages
    const AREA_LABELS: Record<string, string> = {
      CONSULTA_PRIVADA: 'Consulta Privada',
      CLINICA: 'Clínica / Hospital',
      DEPORTIVO: 'Nutrición Deportiva',
      ESTUDIANTE: 'Estudiante de Nutrición',
      DOCENCIA: 'Docencia / Investigación',
      OTRO: 'Otro',
    };

    const practiceAreas = leadsByAreaGroup.map((item) => ({
      key: item.practiceArea,
      label: AREA_LABELS[item.practiceArea] || item.practiceArea,
      count: item._count.id,
      percentage:
        totalLeads > 0
          ? Number(((item._count.id / totalLeads) * 100).toFixed(1))
          : 0,
    })).sort((a, b) => b.count - a.count);

    const statuses = leadsByStatusGroup.map((item) => ({
      status: item.status,
      count: item._count.id,
    }));

    // Build daily timeline for charts
    const dailyMap = new Map<string, { date: string; views: number; ctaClicks: number; leads: number }>();
    for (let i = 0; i <= safeDays; i++) {
      const d = new Date(startDate);
      d.setDate(d.getDate() + i);
      const key = d.toISOString().split('T')[0];
      dailyMap.set(key, { date: key, views: 0, ctaClicks: 0, leads: 0 });
    }

    allEvents.forEach((ev) => {
      const key = ev.createdAt.toISOString().split('T')[0];
      const entry = dailyMap.get(key);
      if (entry) {
        if (ev.eventType === 'PAGE_VIEW') entry.views += 1;
        if (ev.eventType === 'HERO_CTA_CLICK') entry.ctaClicks += 1;
      }
    });

    const leadsInPeriod = await this.prisma.landingLead.findMany({
      where: { createdAt: { gte: startDate } },
      select: { createdAt: true },
    });

    leadsInPeriod.forEach((l) => {
      const key = l.createdAt.toISOString().split('T')[0];
      const entry = dailyMap.get(key);
      if (entry) {
        entry.leads += 1;
      }
    });

    const dailyTimeline = Array.from(dailyMap.values()).sort((a, b) =>
      a.date.localeCompare(b.date),
    );

    return {
      periodDays: safeDays,
      overview: {
        totalPageViews,
        uniqueVisitors,
        totalHeroCtaClicks,
        ctr,
        totalLeads,
        conversionRate,
      },
      practiceAreas,
      statuses,
      dailyTimeline,
      recentLeads,
      recentEvents,
    };
  }

  /**
   * Retrieves paginated leads with filters.
   */
  async getAdminLeads(params: {
    search?: string;
    status?: string;
    practiceArea?: string;
    page?: number;
    limit?: number;
  }) {
    const page = Math.max(Number(params.page) || 1, 1);
    const limit = Math.min(Math.max(Number(params.limit) || 20, 1), 100);
    const skip = (page - 1) * limit;

    const where: any = {};

    if (params.status && params.status !== 'ALL') {
      where.status = params.status;
    }

    if (params.practiceArea && params.practiceArea !== 'ALL') {
      where.practiceArea = params.practiceArea;
    }

    if (params.search?.trim()) {
      const term = params.search.trim();
      where.OR = [
        { fullName: { contains: term, mode: 'insensitive' } },
        { email: { contains: term, mode: 'insensitive' } },
        { phone: { contains: term, mode: 'insensitive' } },
      ];
    }

    const [total, leads] = await Promise.all([
      this.prisma.landingLead.count({ where }),
      this.prisma.landingLead.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    return {
      leads,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  /**
   * Updates lead status and notes.
   */
  async updateLead(id: string, dto: UpdateLandingLeadDto) {
    const lead = await this.prisma.landingLead.findUnique({
      where: { id },
    });

    if (!lead) {
      throw new NotFoundException('Lead no encontrado');
    }

    return this.prisma.landingLead.update({
      where: { id },
      data: {
        ...(dto.status ? { status: dto.status } : {}),
        ...(dto.notes !== undefined ? { notes: dto.notes } : {}),
      },
    });
  }

  /**
   * Deletes a lead.
   */
  async deleteLead(id: string) {
    const lead = await this.prisma.landingLead.findUnique({
      where: { id },
    });

    if (!lead) {
      throw new NotFoundException('Lead no encontrado');
    }

    await this.prisma.landingLead.delete({
      where: { id },
    });

    return { success: true, message: 'Lead eliminado' };
  }
}
