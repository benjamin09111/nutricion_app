import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import { AppointmentStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { MailService } from '../mail/mail.service';
import { UpdateScheduleDto, TimeSlotDto } from './dto/update-schedule.dto';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { GoogleIntegrationService } from '../integrations/google-integration.service';

import {
  AppointmentCalendarWithNutritionist,
  AppointmentCalendarWithSchedule,
  AppointmentRecord,
  AppointmentTimeSlotRecord,
  AvailabilityRuleRecord,
  BookingLinkRecord,
  FreeSlotRecord,
} from './appointments.types';

interface AvailabilityRulePayload {
  rules?: Array<{
    dayOfWeek?: number;
    startTime?: string;
    endTime?: string;
    isAvailable?: boolean;
  }>;
}

interface CreateBookingLinkPayload {
  mode?: string;
  allowedUses?: number | null;
  expiresAt?: string | null;
  metadata?: Record<string, unknown>;
  fixedStartAt?: string;
  fixedEndAt?: string;
}

interface FreeSlotQuery {
  calendarId: string;
  from: string;
  to: string;
  durationMin?: number;
}

interface ListAppointmentsQuery {
  nutritionistId: string;
  calendarId?: string;
  from?: string;
  to?: string;
  status?: string;
}

interface RequestAppointmentInput {
  calendarId: string;
  nutritionistId: string;
  start: string;
  end: string;
  guestName?: string;
  guestEmail?: string;
  guestPhone?: string;
  message?: string;
  patientId?: string;
  source: 'public-profile' | 'patient-portal' | 'booking-link' | 'manual';
}

interface AppointmentNotificationPayload {
  recipientEmail: string;
  recipientName: string;
  nutritionistName: string;
  timeZone: string;
  appointmentDate: Date;
  startTime: Date;
  endTime: Date;
  message?: string | null;
  reason?: string | null;
}

const WEEKDAY_INDEX_BY_NAME: Record<string, number> = {
  sunday: 0,
  monday: 1,
  tuesday: 2,
  wednesday: 3,
  thursday: 4,
  friday: 5,
  saturday: 6,
};

const BLOCKING_APPOINTMENT_STATUSES = new Set<AppointmentStatus>([
  AppointmentStatus.SCHEDULED,
  AppointmentStatus.CONFIRMED,
]);

const DISPLAY_CONFIRMED_STATUSES = new Set<AppointmentStatus>([
  AppointmentStatus.SCHEDULED,
  AppointmentStatus.CONFIRMED,
]);

const extractDateKey = (value: string) => value.split('T')[0];

const isPlainObject = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === 'object' && !Array.isArray(value);

const parseDateKey = (value: string) => {
  const [year, month, day] = value.split('-').map(Number);
  return { year, month, day };
};

const getWeekdayIndexInTimeZone = (dateKey: string, timeZone: string) => {
  const { year, month, day } = parseDateKey(dateKey);
  const ref = new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
  const weekday = new Intl.DateTimeFormat('en-US', {
    timeZone,
    weekday: 'long',
  })
    .format(ref)
    .toLowerCase();

  return WEEKDAY_INDEX_BY_NAME[weekday] ?? ref.getUTCDay();
};

const getDatePartsInTimeZone = (date: Date, timeZone: string) => {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(date);

  const readPart = (type: string) =>
    Number(parts.find((part) => part.type === type)?.value || 0);

  return {
    dateKey: `${readPart('year')}-${String(readPart('month')).padStart(2, '0')}-${String(readPart('day')).padStart(2, '0')}`,
    hour: readPart('hour'),
    minute: readPart('minute'),
  };
};

const getDateKeyInTimeZone = (date: Date, timeZone: string) =>
  getDatePartsInTimeZone(date, timeZone).dateKey;

const getBlockKeyInTimeZone = (date: Date, timeZone: string) => {
  const { dateKey, hour } = getDatePartsInTimeZone(date, timeZone);
  return `${dateKey}-${hour}`;
};

const getBlockRangeInTimeZone = (date: Date, timeZone: string) => {
  const { dateKey, hour } = getDatePartsInTimeZone(date, timeZone);
  return {
    start: new Date(localDateTimeToUtcIso(dateKey, hour, timeZone)),
    end: new Date(localDateTimeToUtcIso(dateKey, hour + 1, timeZone)),
  };
};

const parseAppointmentMetadata = (
  metadata: Prisma.JsonValue | null | undefined,
): Record<string, unknown> | null => {
  if (!isPlainObject(metadata)) {
    return null;
  }

  return metadata;
};

const getAppointmentStatus = (status: string | AppointmentStatus) =>
  status.toString().toUpperCase() as AppointmentStatus;

const normalizeCalendarTimeZone = (timeZone?: string | null) =>
  !timeZone || timeZone === 'UTC' ? 'America/Santiago' : timeZone;

const mapSerializableTransactionError = (error: unknown) => {
  if (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === 'P2034'
  ) {
    return new BadRequestException('Ese horario ya no está disponible');
  }

  return error;
};

const assertAtLeastNextDayInTimeZone = (date: Date, timeZone: string) => {
  const todayKey = getDateKeyInTimeZone(new Date(), timeZone);
  const targetKey = getDateKeyInTimeZone(date, timeZone);

  if (targetKey <= todayKey) {
    throw new BadRequestException(
      'Solo puedes solicitar citas desde mañana en adelante',
    );
  }
};

const localDateTimeToUtcIso = (
  dateKey: string,
  hour: number,
  timeZone: string,
) => {
  const { year, month, day } = parseDateKey(dateKey);
  const desiredLocalUtcMs = Date.UTC(year, month - 1, day, hour, 0, 0);
  let utcGuess = desiredLocalUtcMs;

  for (let i = 0; i < 5; i += 1) {
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hourCycle: 'h23',
    }).formatToParts(new Date(utcGuess));

    const getPart = (type: string) =>
      Number(parts.find((part) => part.type === type)?.value || 0);

    const formattedAsUtc = Date.UTC(
      getPart('year'),
      getPart('month') - 1,
      getPart('day'),
      getPart('hour'),
      getPart('minute'),
      getPart('second'),
    );

    const delta = formattedAsUtc - desiredLocalUtcMs;
    if (delta === 0) break;
    utcGuess -= delta;
  }

  return new Date(utcGuess).toISOString();
};

@Injectable()
export class AppointmentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly mailService: MailService,
    private readonly googleIntegrationService: GoogleIntegrationService,
  ) {}

  private normalizeAppointment(appointment: {
    id: string;
    calendarId: string;
    patientId: string | null;
    patientName?: string | null;
    title: string | null;
    description: string | null;
    metadata?: Prisma.JsonValue | null;
    startTime: Date;
    endTime: Date;
    status: AppointmentStatus;
    notes: string | null;
    meetingUrl?: string | null;
    googleCalendarEventId?: string | null;
    googleCalendarHtmlLink?: string | null;
    googleCalendarSyncedAt?: Date | null;
    googleCalendarSyncError?: string | null;
    createdAt: Date;
    updatedAt: Date;
  }): AppointmentRecord {
    return {
      id: appointment.id,
      calendarId: appointment.calendarId,
      patientId: appointment.patientId,
      patientName: appointment.patientName || null,
      title: appointment.title,
      description: appointment.description,
      metadata: parseAppointmentMetadata(appointment.metadata),
      start: appointment.startTime,
      end: appointment.endTime,
      status: appointment.status,
      notes: appointment.notes,
      meetingUrl: appointment.meetingUrl || null,
      googleCalendarEventId: appointment.googleCalendarEventId || null,
      googleCalendarHtmlLink: appointment.googleCalendarHtmlLink || null,
      googleCalendarSyncedAt: appointment.googleCalendarSyncedAt || null,
      googleCalendarSyncError: appointment.googleCalendarSyncError || null,
      createdAt: appointment.createdAt,
      updatedAt: appointment.updatedAt,
    };
  }

  private isBlockingStatus(status: AppointmentStatus) {
    return BLOCKING_APPOINTMENT_STATUSES.has(status);
  }

  private isConfirmedStatus(status: AppointmentStatus) {
    return DISPLAY_CONFIRMED_STATUSES.has(status);
  }

  private buildAppointmentDateLabel(startTime: Date, timeZone: string) {
    return new Intl.DateTimeFormat('es-CL', {
      timeZone,
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(startTime);
  }

  private buildAppointmentTimeLabel(
    startTime: Date,
    endTime: Date,
    timeZone: string,
  ) {
    const formatter = new Intl.DateTimeFormat('es-CL', {
      timeZone,
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23',
    });

    return `${formatter.format(startTime)} - ${formatter.format(endTime)}`;
  }

  private async sendAppointmentRequestEmails(
    payload: AppointmentNotificationPayload,
  ) {
    await this.mailService.sendAppointmentRequestReceivedEmail({
      recipientEmail: payload.recipientEmail,
      recipientName: payload.recipientName,
      nutritionistName: payload.nutritionistName,
      timeZone: payload.timeZone,
      appointmentDate: payload.appointmentDate,
      startTime: payload.startTime,
      endTime: payload.endTime,
      message: payload.message,
    });
  }

  private async sendAppointmentConfirmedEmail(
    payload: AppointmentNotificationPayload,
  ) {
    await this.mailService.sendAppointmentConfirmedEmail({
      recipientEmail: payload.recipientEmail,
      recipientName: payload.recipientName,
      nutritionistName: payload.nutritionistName,
      timeZone: payload.timeZone,
      appointmentDate: payload.appointmentDate,
      startTime: payload.startTime,
      endTime: payload.endTime,
    });
  }

  private async sendAppointmentRejectedEmail(
    payload: AppointmentNotificationPayload,
  ) {
    await this.mailService.sendAppointmentRejectedEmail({
      recipientEmail: payload.recipientEmail,
      recipientName: payload.recipientName,
      nutritionistName: payload.nutritionistName,
      timeZone: payload.timeZone,
      appointmentDate: payload.appointmentDate,
      startTime: payload.startTime,
      endTime: payload.endTime,
      reason: payload.reason,
    });
  }

  private async findConflictingAppointment(
    calendarId: string,
    start: Date,
    end: Date,
  ) {
    return this.prisma.appointment.findFirst({
      where: {
        calendarId,
        status: { in: [...BLOCKING_APPOINTMENT_STATUSES] },
        startTime: { lt: end },
        endTime: { gt: start },
      },
      select: { id: true, status: true },
    });
  }

  private async runSerializableTransaction<T>(
    work: (tx: Prisma.TransactionClient) => Promise<T>,
  ): Promise<T> {
    try {
      return await this.prisma.$transaction(work, {
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
      });
    } catch (error) {
      throw mapSerializableTransactionError(error);
    }
  }

  async getOrCreateCalendar(
    nutritionistId: string,
  ): Promise<AppointmentCalendarWithNutritionist> {
    const nutritionist = await this.prisma.nutritionist.findUnique({
      where: { id: nutritionistId },
      select: { id: true },
    });

    if (!nutritionist) {
      throw new NotFoundException('Perfil de nutricionista no encontrado');
    }

    let calendar = await this.prisma.appointmentCalendar.findUnique({
      where: { nutritionistId },
      include: { nutritionist: { include: { account: true } } },
    });

    if (!calendar) {
      calendar = await this.prisma.appointmentCalendar.create({
        data: {
          nutritionistId,
          name: 'Mi Agenda',
          title: 'Calendario de Citas',
          timeZone: 'America/Santiago',
        },
        include: { nutritionist: { include: { account: true } } },
      });
    }

    return calendar;
  }

  async createBookingLink(
    calendarId: string,
    payload: CreateBookingLinkPayload,
  ): Promise<BookingLinkRecord> {
    const calendar = await this.prisma.appointmentCalendar.findUnique({
      where: { id: calendarId },
      include: { nutritionist: { include: { account: true } } },
    });

    if (!calendar) {
      throw new NotFoundException('Calendario no encontrado');
    }

    const token = randomUUID();
    const frontendUrl = (
      process.env.FRONTEND_URL ||
      process.env.NEXT_PUBLIC_FRONTEND_URL ||
      ''
    ).replace(/\/$/, '');
    const url = frontendUrl
      ? `${frontendUrl}/portal/citas/${calendar.nutritionistId}/${token}`
      : `/portal/citas/${calendar.nutritionistId}/${token}`;

    const bookingLink = await this.prisma.bookingLink.create({
      data: {
        calendarId: calendar.id,
        token,
        url,
        allowedUses: payload.allowedUses ?? null,
        expiresAt: payload.expiresAt ? new Date(payload.expiresAt) : null,
        metadata: {
          ...(payload.metadata || {}),
          mode: payload.mode || 'FLEXIBLE',
          fixedStartAt: payload.fixedStartAt || null,
          fixedEndAt: payload.fixedEndAt || null,
        },
      },
    });

    return {
      ...bookingLink,
      calendarId: calendar.id,
      nutritionistId: calendar.nutritionistId,
      nutritionistName: calendar.nutritionist?.fullName || calendar.name,
      title: calendar.title,
      description: calendar.description,
      timeZone: normalizeCalendarTimeZone(calendar.timeZone),
      timezone: normalizeCalendarTimeZone(calendar.timeZone),
      metadata: bookingLink.metadata as Record<string, unknown> | null,
    };
  }

  async getBookingLinkByToken(token: string): Promise<BookingLinkRecord> {
    const bookingLink = await this.prisma.bookingLink.findUnique({
      where: { token },
      include: {
        calendar: {
          include: { nutritionist: { include: { account: true } } },
        },
      },
    });

    if (!bookingLink) {
      throw new NotFoundException('Enlace no encontrado');
    }

    return {
      ...bookingLink,
      calendarId: bookingLink.calendarId,
      nutritionistId: bookingLink.calendar.nutritionistId,
      nutritionistName:
        bookingLink.calendar.nutritionist?.fullName ||
        bookingLink.calendar.name,
      title: bookingLink.calendar.title,
      description: bookingLink.calendar.description,
      timeZone: normalizeCalendarTimeZone(bookingLink.calendar.timeZone),
      timezone: normalizeCalendarTimeZone(bookingLink.calendar.timeZone),
      metadata: bookingLink.metadata as Record<string, unknown> | null,
    };
  }

  async getFreeSlots(
    query: FreeSlotQuery,
  ): Promise<{ slots: FreeSlotRecord[] }> {
    const calendar = await this.prisma.appointmentCalendar.findUnique({
      where: { id: query.calendarId },
      include: {
        timeSlots: true,
        nutritionist: { include: { account: true } },
      },
    });

    if (!calendar) {
      throw new NotFoundException('Calendario no encontrado');
    }

    const timeZone = normalizeCalendarTimeZone(calendar.timeZone);
    const fromKey = extractDateKey(query.from);
    const toKey = extractDateKey(query.to);
    if (!fromKey || !toKey) {
      throw new BadRequestException('Rango de fechas inválido');
    }

    const durationMin = Math.max(15, Math.trunc(query.durationMin || 60));
    const durationMs = durationMin * 60 * 1000;
    const slots: FreeSlotRecord[] = [];
    const blockingAppointments = await this.prisma.appointment.findMany({
      where: {
        calendarId: calendar.id,
        status: { in: [...BLOCKING_APPOINTMENT_STATUSES] },
        startTime: { lt: new Date(`${toKey}T23:59:59.999Z`) },
        endTime: { gt: new Date(`${fromKey}T00:00:00.000Z`) },
      },
      select: { startTime: true, endTime: true },
    });

    const googleBusyRanges = await this.googleIntegrationService
      .getBusyEventsForCalendar(
        calendar.id,
        new Date(`${fromKey}T00:00:00.000Z`).toISOString(),
        new Date(`${toKey}T23:59:59.999Z`).toISOString(),
      )
      .catch(() => [] as Array<{ start: Date; end: Date }>);
    const current = new Date(`${fromKey}T12:00:00.000Z`);
    const end = new Date(`${toKey}T12:00:00.000Z`);

    while (current <= end) {
      const dateKey = new Intl.DateTimeFormat('en-CA', {
        timeZone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      }).format(current);

      const dayOfWeek = getWeekdayIndexInTimeZone(dateKey, timeZone);

      for (const slot of calendar.timeSlots) {
        if (slot.dayOfWeek !== dayOfWeek || !slot.isAvailable) continue;

        const startIso = localDateTimeToUtcIso(dateKey, slot.hour, timeZone);
        const slotStart = new Date(startIso);
        const slotEnd = new Date(slotStart.getTime() + durationMs);

        if (
          slotStart.getTime() >=
            new Date(`${fromKey}T00:00:00.000Z`).getTime() &&
          slotEnd.getTime() <= new Date(`${toKey}T23:59:59.999Z`).getTime()
        ) {
          const isBusy =
            blockingAppointments.some((appointment) => {
              const appointmentStartKey = getBlockKeyInTimeZone(
                appointment.startTime,
                timeZone,
              );
              return (
                appointmentStartKey === `${dateKey}-${slot.hour}` ||
                (slotStart.getTime() < appointment.endTime.getTime() &&
                  slotEnd.getTime() > appointment.startTime.getTime())
              );
            }) ||
            googleBusyRanges.some(
              (busy) =>
                slotStart.getTime() < busy.end.getTime() &&
                slotEnd.getTime() > busy.start.getTime(),
            );
          slots.push({
            start: slotStart.toISOString(),
            end: slotEnd.toISOString(),
            available: !isBusy,
            status: isBusy ? 'BUSY' : 'AVAILABLE',
          });
        }
      }

      current.setDate(current.getDate() + 1);
    }

    return { slots };
  }

  async getCalendarById(
    calendarId: string,
    nutritionistId: string,
  ): Promise<AppointmentCalendarWithNutritionist> {
    const calendar = await this.prisma.appointmentCalendar.findFirst({
      where: {
        id: calendarId,
        nutritionistId,
      },
      include: { nutritionist: { include: { account: true } } },
    });

    if (!calendar) {
      throw new NotFoundException('Calendario no encontrado');
    }

    return calendar;
  }

  async getMyCalendar(
    nutritionistId: string,
  ): Promise<AppointmentCalendarWithSchedule> {
    const calendar = await this.getOrCreateCalendar(nutritionistId);
    return this.getCalendarWithSchedule(calendar.id, nutritionistId);
  }

  async getCalendarWithSchedule(
    calendarId: string,
    nutritionistId: string,
  ): Promise<AppointmentCalendarWithSchedule> {
    const calendar = await this.getCalendarById(calendarId, nutritionistId);

    const timeSlots = await this.prisma.appointmentTimeSlot.findMany({
      where: { calendarId },
      orderBy: [{ dayOfWeek: 'asc' }, { hour: 'asc' }],
    });

    const googleStatus =
      await this.googleIntegrationService.getConnectionStatus(
        calendar.nutritionist.account.id,
      );

    return {
      ...calendar,
      googleCalendarConnected: googleStatus.connected,
      googleSyncEnabled: googleStatus.connected,
      isGoogleConnected: googleStatus.connected,
      googleCalendarEmail: googleStatus.googleEmail,
      googleCalendarStatus: googleStatus,
      schedule: this.formatSchedule(timeSlots),
    } as AppointmentCalendarWithSchedule;
  }

  async listAppointments(
    query: ListAppointmentsQuery,
  ): Promise<AppointmentRecord[]> {
    const where: Prisma.AppointmentWhereInput = {
      calendar: {
        nutritionistId: query.nutritionistId,
      },
    };

    if (query.calendarId) {
      where.calendarId = query.calendarId;
    }

    if (query.from || query.to) {
      where.startTime = {};
      if (query.from) where.startTime.gte = new Date(query.from);
      if (query.to) where.startTime.lte = new Date(query.to);
    }

    if (query.status) {
      const normalizedStatus = getAppointmentStatus(query.status);
      where.status =
        normalizedStatus === AppointmentStatus.CONFIRMED
          ? { in: [AppointmentStatus.CONFIRMED, AppointmentStatus.SCHEDULED] }
          : normalizedStatus;
    }

    const appointments = await this.prisma.appointment.findMany({
      where,
      orderBy: { startTime: 'asc' },
    });

    return appointments.map((appointment) =>
      this.normalizeAppointment(appointment),
    );
  }

  async getWeekView(
    calendarId: string,
    nutritionistId: string,
    weekStart: string,
  ): Promise<{ events: AppointmentRecord[] }> {
    await this.getCalendarById(calendarId, nutritionistId);

    const from = new Date(`${weekStart}T00:00:00.000Z`);
    const to = new Date(from);
    to.setDate(to.getDate() + 7);

    const events = await this.prisma.appointment.findMany({
      where: {
        calendarId,
        status: { in: [...DISPLAY_CONFIRMED_STATUSES] },
        startTime: { gte: from, lt: to },
      },
      orderBy: { startTime: 'asc' },
      select: {
        id: true,
        calendarId: true,
        patientId: true,
        patientName: true,
        title: true,
        description: true,
        metadata: true,
        startTime: true,
        endTime: true,
        status: true,
        notes: true,
        googleCalendarEventId: true,
        googleCalendarHtmlLink: true,
        googleCalendarSyncedAt: true,
        googleCalendarSyncError: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return {
      events: events.map((event) => this.normalizeAppointment(event)),
    };
  }

  async requestAppointment(
    nutritionistId: string,
    dto: RequestAppointmentInput,
  ) {
    const calendar = await this.getCalendarById(dto.calendarId, nutritionistId);
    const timeZone = normalizeCalendarTimeZone(calendar.timeZone);
    const start = new Date(dto.start);
    const end = new Date(dto.end);

    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      throw new BadRequestException('Fechas inválidas');
    }

    if (end.getTime() <= start.getTime()) {
      throw new BadRequestException('La cita debe terminar después de iniciar');
    }

    assertAtLeastNextDayInTimeZone(start, timeZone);

    const durationMin = Math.round((end.getTime() - start.getTime()) / 60000);
    if (durationMin < 5 || durationMin > 60) {
      throw new BadRequestException(
        'La duración debe estar entre 5 y 60 minutos',
      );
    }

    if (start.getTime() < Date.now() + 5 * 60 * 1000) {
      throw new BadRequestException(
        'La cita debe empezar al menos 5 minutos en el futuro',
      );
    }

    const googleBusyRanges = await this.googleIntegrationService
      .getBusyEventsForCalendar(
        calendar.id,
        start.toISOString(),
        end.toISOString(),
      )
      .catch(() => [] as Array<{ start: Date; end: Date }>);

    if (googleBusyRanges.some((busy) => start < busy.end && end > busy.start)) {
      throw new BadRequestException('Ese horario ya no está disponible');
    }

    let patientName = dto.guestName?.trim() || '';
    let patientEmail = dto.guestEmail?.trim() || '';
    let patientPhone: string | null = dto.guestPhone?.trim() || null;

    const appointment = await this.runSerializableTransaction(async (tx) => {
      const patient = dto.patientId
        ? await tx.patient.findFirst({
            where: {
              id: dto.patientId,
              nutritionistId,
            },
          })
        : null;

      patientName = patient?.fullName || dto.guestName?.trim() || '';
      patientEmail = patient?.email || dto.guestEmail?.trim() || '';
      patientPhone = patient?.phone || dto.guestPhone?.trim() || null;

      if (!patientName || !patientEmail) {
        throw new BadRequestException(
          'Nombre y correo son requeridos para solicitar una cita',
        );
      }

      const conflict = await tx.appointment.findFirst({
        where: {
          calendarId: calendar.id,
          status: { in: [...BLOCKING_APPOINTMENT_STATUSES] },
          startTime: { lt: end },
          endTime: { gt: start },
        },
        select: { id: true },
      });

      if (conflict) {
        throw new BadRequestException('Ese horario ya no está disponible');
      }

      const googleBusyRanges = await this.googleIntegrationService
        .getBusyEventsForCalendar(
          calendar.id,
          start.toISOString(),
          end.toISOString(),
        )
        .catch(() => [] as Array<{ start: Date; end: Date }>);

      if (
        googleBusyRanges.some((busy) => start < busy.end && end > busy.start)
      ) {
        throw new BadRequestException('Ese horario ya no está disponible');
      }

      return tx.appointment.create({
        data: {
          calendarId: calendar.id,
          patientId: patient?.id ?? null,
          patientName,
          title: dto.message?.trim()
            ? `Solicitud de cita - ${patientName}`
            : 'Solicitud de cita',
          description:
            dto.message?.trim() ||
            'Solicitud de cita pendiente de confirmación',
          metadata: {
            source: dto.source,
            guestEmail: patientEmail,
            guestPhone: patientPhone,
            patientId: patient?.id ?? null,
            nutritionistId,
          },
          startTime: start,
          endTime: end,
          status: AppointmentStatus.REQUESTED,
          notes: dto.message?.trim() || null,
        },
      });
    });

    const nutritionistName = calendar.nutritionist.fullName || calendar.name;
    const requestEmails: Promise<unknown>[] = [
      this.sendAppointmentRequestEmails({
        recipientEmail: patientEmail,
        recipientName: patientName,
        nutritionistName,
        timeZone: calendar.timeZone,
        appointmentDate: start,
        startTime: start,
        endTime: end,
        message: dto.message,
      }),
    ];

    if (calendar.nutritionist.account?.email) {
      requestEmails.push(
        this.mailService.sendAppointmentRequestEmail({
          nutritionistEmail: calendar.nutritionist.account.email,
          nutritionistName,
          guestName: patientName,
          guestEmail: patientEmail,
          guestPhone: patientPhone || undefined,
          message: dto.message,
          appointmentDate: start,
        }),
      );
    }

    await Promise.allSettled(requestEmails);

    await this.googleIntegrationService.syncAppointmentToGoogle({
      calendarId: calendar.id,
      appointment: appointment as any,
      inviteEmail: patientEmail,
      inviteName: patientName,
      syncGoogleCalendar: true,
    });

    const refreshed = await this.prisma.appointment.findUnique({
      where: { id: appointment.id },
    });

    return this.normalizeAppointment(refreshed || appointment);
  }

  async createAppointment(
    nutritionistId: string,
    dto: CreateAppointmentDto,
  ): Promise<AppointmentRecord> {
    const calendar = await this.getCalendarById(dto.calendarId, nutritionistId);
    const description = dto.description.trim();

    const start = new Date(dto.start);
    const end = new Date(dto.end);

    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      throw new BadRequestException('Fechas inválidas');
    }

    if (!description) {
      throw new BadRequestException('La descripción de la cita es obligatoria');
    }

    if (end.getTime() <= start.getTime()) {
      throw new BadRequestException('La cita debe terminar después de iniciar');
    }

    const durationMin = Math.round((end.getTime() - start.getTime()) / 60000);
    if (durationMin < 5 || durationMin > 60) {
      throw new BadRequestException(
        'La duración debe estar entre 5 y 60 minutos',
      );
    }

    const notifyPatientByEmail =
      dto.notifyPatientByEmail ?? Boolean(dto.patientEmail?.trim());
    const syncGoogleCalendar = dto.syncGoogleCalendar ?? true;

    if (start.getTime() < Date.now() + 5 * 60 * 1000) {
      throw new BadRequestException(
        'La cita debe empezar al menos 5 minutos en el futuro',
      );
    }

    const googleBusyRanges = await this.googleIntegrationService
      .getBusyEventsForCalendar(
        calendar.id,
        start.toISOString(),
        end.toISOString(),
      )
      .catch(() => [] as Array<{ start: Date; end: Date }>);

    if (googleBusyRanges.some((busy) => start < busy.end && end > busy.start)) {
      throw new BadRequestException('Ese horario ya no está disponible');
    }

    let patientName = '';
    let patientEmail: string | null = null;

    const appointment = await this.runSerializableTransaction(async (tx) => {
      const patient = dto.patientId
        ? await tx.patient.findFirst({
            where: {
              id: dto.patientId,
              nutritionistId,
            },
          })
        : null;

      if (dto.patientId && !patient) {
        throw new NotFoundException('Paciente no encontrado');
      }

      patientName =
        patient?.fullName || dto.patientName?.trim() || dto.title?.trim() || '';
      patientEmail = patient?.email || dto.patientEmail?.trim() || null;

      if (!patientName) {
        throw new BadRequestException('El nombre del paciente es obligatorio');
      }

      const conflict = await tx.appointment.findFirst({
        where: {
          calendarId: calendar.id,
          status: { in: [...BLOCKING_APPOINTMENT_STATUSES] },
          startTime: { lt: end },
          endTime: { gt: start },
        },
        select: { id: true },
      });

      if (conflict) {
        throw new BadRequestException('Ese horario ya no está disponible');
      }

      const googleBusyRanges = await this.googleIntegrationService
        .getBusyEventsForCalendar(
          calendar.id,
          start.toISOString(),
          end.toISOString(),
        )
        .catch(() => [] as Array<{ start: Date; end: Date }>);

      if (
        googleBusyRanges.some((busy) => start < busy.end && end > busy.start)
      ) {
        throw new BadRequestException('Ese horario ya no está disponible');
      }

      return tx.appointment.create({
        data: {
          calendarId: calendar.id,
          patientId: patient?.id ?? null,
          patientName,
          title: dto.title?.trim() || description,
          description,
          metadata: {
            source: 'manual',
            nutritionistId,
            patientId: patient?.id ?? null,
            patientEmail,
          },
          startTime: start,
          endTime: end,
          status: AppointmentStatus.CONFIRMED,
          notes: dto.notes?.trim() || description,
        },
      });
    });

    if (patientEmail) {
      if (notifyPatientByEmail) {
        await this.sendAppointmentConfirmedEmail({
          recipientEmail: patientEmail,
          recipientName: patientName,
          nutritionistName: calendar.nutritionist.fullName || calendar.name,
          timeZone: calendar.timeZone,
          appointmentDate: start,
          startTime: start,
          endTime: end,
          message: description,
        });
      }
    }

    await this.googleIntegrationService.syncAppointmentToGoogle({
      calendarId: calendar.id,
      appointment: appointment as any,
      inviteEmail: notifyPatientByEmail ? patientEmail : null,
      inviteName: patientName,
      syncGoogleCalendar,
    });

    const refreshed = await this.prisma.appointment.findUnique({
      where: { id: appointment.id },
    });

    return this.normalizeAppointment(refreshed || appointment);
  }

  private formatSchedule(
    slots: AppointmentTimeSlotRecord[],
  ): Record<string, Record<number, { available: boolean }>> {
    const schedule: Record<string, Record<number, { available: boolean }>> = {};

    for (let day = 0; day < 7; day++) {
      schedule[day] = {};
      for (let hour = 0; hour < 24; hour++) {
        schedule[day][hour] = { available: false };
      }
    }

    for (const slot of slots) {
      schedule[slot.dayOfWeek][slot.hour] = {
        available: slot.isAvailable,
      };
    }

    return schedule;
  }

  async updateSchedule(
    calendarId: string,
    nutritionistId: string,
    dto: UpdateScheduleDto,
  ): Promise<AppointmentCalendarWithSchedule> {
    const calendar = await this.getCalendarById(calendarId, nutritionistId);

    const existingSlots = await this.prisma.appointmentTimeSlot.findMany({
      where: { calendarId },
    });

    const existingMap = new Map(
      existingSlots.map((s) => [`${s.dayOfWeek}-${s.hour}`, s.id]),
    );

    const upsertPromises: Array<Prisma.PrismaPromise<unknown>> = [];

    for (const slot of dto.slots) {
      const key = `${slot.dayOfWeek}-${slot.hour}`;
      const existingId = existingMap.get(key);

      if (existingId) {
        upsertPromises.push(
          this.prisma.appointmentTimeSlot.update({
            where: { id: existingId },
            data: { isAvailable: slot.isAvailable },
          }),
        );
      } else {
        upsertPromises.push(
          this.prisma.appointmentTimeSlot.create({
            data: {
              calendarId: calendar.id,
              dayOfWeek: slot.dayOfWeek,
              hour: slot.hour,
              isAvailable: slot.isAvailable,
            },
          }),
        );
      }
    }

    await Promise.all(upsertPromises);

    return this.getCalendarWithSchedule(calendarId, nutritionistId);
  }

  async setDefaultSchedule(
    nutritionistId: string,
  ): Promise<AppointmentCalendarWithSchedule> {
    const calendar = await this.getOrCreateCalendar(nutritionistId);

    const defaultSlots: TimeSlotDto[] = [];

    for (let day = 1; day <= 5; day++) {
      for (let hour = 8; hour <= 16; hour++) {
        defaultSlots.push({
          dayOfWeek: day,
          hour,
          isAvailable: true,
        });
      }
    }

    return this.updateSchedule(calendar.id, nutritionistId, {
      slots: defaultSlots,
    });
  }

  async updateAvailabilityRules(
    calendarId: string,
    nutritionistId: string,
    payload: AvailabilityRulePayload,
  ): Promise<AppointmentCalendarWithSchedule> {
    const calendar = await this.getCalendarById(calendarId, nutritionistId);

    await this.prisma.appointmentTimeSlot.deleteMany({
      where: { calendarId },
    });

    const slots: TimeSlotDto[] = [];

    if (payload.rules) {
      for (const rule of payload.rules) {
        if (rule.dayOfWeek !== undefined && rule.startTime && rule.endTime) {
          const startHour = parseInt(rule.startTime.split(':')[0], 10);
          const endHour = parseInt(rule.endTime.split(':')[0], 10);
          const isAvailable = rule.isAvailable ?? true;

          for (let hour = startHour; hour < endHour; hour++) {
            slots.push({
              dayOfWeek: rule.dayOfWeek,
              hour,
              isAvailable,
            });
          }
        }
      }
    }

    if (slots.length > 0) {
      await this.prisma.appointmentTimeSlot.createMany({
        data: slots.map((slot) => ({
          calendarId: calendar.id,
          dayOfWeek: slot.dayOfWeek,
          hour: slot.hour,
          isAvailable: slot.isAvailable,
        })),
      });
    }

    return this.getCalendarWithSchedule(calendarId, nutritionistId);
  }

  async getAvailabilityRules(
    calendarId: string,
    nutritionistId: string,
  ): Promise<{ rules: AvailabilityRuleRecord[] }> {
    await this.getCalendarById(calendarId, nutritionistId);

    const timeSlots = await this.prisma.appointmentTimeSlot.findMany({
      where: { calendarId, isAvailable: true },
      orderBy: [{ dayOfWeek: 'asc' }, { hour: 'asc' }],
    });

    const rules: AvailabilityRuleRecord[] = [];
    const dayRules = new Map<number, { start: number; end: number }>();

    for (const slot of timeSlots) {
      const existing = dayRules.get(slot.dayOfWeek);
      if (!existing) {
        dayRules.set(slot.dayOfWeek, { start: slot.hour, end: slot.hour + 1 });
      } else {
        if (slot.hour < existing.start) existing.start = slot.hour;
        if (slot.hour + 1 > existing.end) existing.end = slot.hour + 1;
      }
    }

    for (const [day, range] of dayRules) {
      rules.push({
        dayOfWeek: day,
        startTime: `${range.start.toString().padStart(2, '0')}:00`,
        endTime: `${range.end.toString().padStart(2, '0')}:00`,
        isAvailable: true,
      });
    }

    return { rules };
  }

  async approveAppointment(
    nutritionistId: string,
    appointmentId: string,
    startTime?: string,
    endTime?: string,
    notifyPatientByEmail?: boolean,
    syncGoogleCalendar?: boolean,
  ) {
    const calendar = await this.prisma.appointmentCalendar.findFirst({
      where: { nutritionistId },
      include: { nutritionist: { include: { account: true } } },
    });

    if (!calendar) {
      throw new NotFoundException('Calendario no encontrado');
    }

    const parsedStart = startTime ? new Date(startTime) : null;
    const parsedEnd = endTime ? new Date(endTime) : null;

    if (
      (parsedStart && Number.isNaN(parsedStart.getTime())) ||
      (parsedEnd && Number.isNaN(parsedEnd.getTime()))
    ) {
      throw new BadRequestException('Fechas inválidas');
    }

    const result = await this.prisma
      .$transaction(
        async (tx) => {
          const appointment = await tx.appointment.findFirst({
            where: {
              id: appointmentId,
              calendarId: calendar.id,
              status: AppointmentStatus.REQUESTED,
            },
            select: {
              id: true,
              patientName: true,
              description: true,
              startTime: true,
              endTime: true,
              metadata: true,
              patient: {
                select: { id: true, fullName: true, email: true },
              },
            },
          });

          if (!appointment) {
            throw new NotFoundException('Cita solicitada no encontrada');
          }

          const finalStart = parsedStart ?? appointment.startTime;
          const finalEnd = parsedEnd ?? appointment.endTime;

          if (finalEnd.getTime() <= finalStart.getTime()) {
            throw new BadRequestException(
              'La cita debe terminar después de iniciar',
            );
          }

          const conflict = await tx.appointment.findFirst({
            where: {
              calendarId: calendar.id,
              id: { not: appointmentId },
              status: { in: [...BLOCKING_APPOINTMENT_STATUSES] },
              startTime: { lt: finalEnd },
              endTime: { gt: finalStart },
            },
            select: { id: true },
          });

          if (conflict) {
            throw new BadRequestException('Ese horario ya no está disponible');
          }

          const googleBusyRanges = await this.googleIntegrationService
            .getBusyEventsForCalendar(
              calendar.id,
              finalStart.toISOString(),
              finalEnd.toISOString(),
            )
            .catch(() => [] as Array<{ start: Date; end: Date }>);

          if (
            googleBusyRanges.some(
              (busy) => finalStart < busy.end && finalEnd > busy.start,
            )
          ) {
            throw new BadRequestException('Ese horario ya no está disponible');
          }

          const nextAppointment = await tx.appointment.update({
            where: { id: appointmentId },
            data: {
              status: AppointmentStatus.CONFIRMED,
              startTime: finalStart,
              endTime: finalEnd,
              metadata: {
                ...(parseAppointmentMetadata(appointment.metadata) || {}),
                confirmedAt: new Date().toISOString(),
              },
            },
          });

          return { appointment, nextAppointment };
        },
        {
          isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
        },
      )
      .catch((error) => {
        throw mapSerializableTransactionError(error);
      });

    const recipientEmail =
      result.appointment.patient?.email ||
      (parseAppointmentMetadata(result.appointment.metadata)?.guestEmail as
        | string
        | undefined);
    const recipientName =
      result.appointment.patient?.fullName ||
      result.appointment.patientName ||
      'Paciente';

    if (recipientEmail && notifyPatientByEmail !== false) {
      await this.sendAppointmentConfirmedEmail({
        recipientEmail,
        recipientName,
        nutritionistName: calendar.nutritionist.fullName || calendar.name,
        timeZone: calendar.timeZone,
        appointmentDate: result.nextAppointment.startTime,
        startTime: result.nextAppointment.startTime,
        endTime: result.nextAppointment.endTime,
        message: result.nextAppointment.description,
      });
    }

    await this.googleIntegrationService.syncAppointmentToGoogle({
      calendarId: calendar.id,
      appointment: result.nextAppointment as any,
      inviteEmail:
        recipientEmail && notifyPatientByEmail !== false
          ? recipientEmail
          : null,
      inviteName: recipientName,
      syncGoogleCalendar: syncGoogleCalendar ?? true,
    });

    const refreshed = await this.prisma.appointment.findUnique({
      where: { id: result.nextAppointment.id },
    });

    return this.normalizeAppointment(refreshed || result.nextAppointment);
  }

  async cancelAppointment(nutritionistId: string, appointmentId: string) {
    const calendar = await this.prisma.appointmentCalendar.findFirst({
      where: { nutritionistId },
      include: { nutritionist: { include: { account: true } } },
    });

    if (!calendar) {
      throw new NotFoundException('Calendario no encontrado');
    }

    const appointment = await this.prisma.appointment.findFirst({
      where: {
        id: appointmentId,
        calendarId: calendar.id,
        status: {
          in: [AppointmentStatus.CONFIRMED, AppointmentStatus.SCHEDULED],
        },
      },
      select: {
        id: true,
        patientName: true,
        description: true,
        startTime: true,
        endTime: true,
        metadata: true,
        googleCalendarEventId: true,
        googleCalendarHtmlLink: true,
        googleCalendarSyncedAt: true,
        googleCalendarSyncError: true,
        patient: {
          select: { id: true, fullName: true, email: true },
        },
      },
    });

    if (!appointment) {
      throw new NotFoundException('Cita no encontrada');
    }

    const updated = await this.prisma.appointment.update({
      where: { id: appointmentId },
      data: {
        status: AppointmentStatus.CANCELLED,
        metadata: {
          ...(parseAppointmentMetadata(appointment.metadata) || {}),
          cancelledAt: new Date().toISOString(),
        },
      },
    });

    await this.googleIntegrationService.deleteAppointmentFromGoogle({
      calendarId: calendar.id,
      appointmentId: updated.id,
      googleCalendarEventId: appointment.googleCalendarEventId,
    });

    const refreshed = await this.prisma.appointment.findUnique({
      where: { id: updated.id },
    });

    return this.normalizeAppointment(refreshed || updated);
  }

  async rejectAppointment(
    nutritionistId: string,
    appointmentId: string,
    reason?: string,
  ) {
    const calendar = await this.prisma.appointmentCalendar.findFirst({
      where: { nutritionistId },
      include: { nutritionist: { include: { account: true } } },
    });

    if (!calendar) {
      throw new NotFoundException('Calendario no encontrado');
    }

    const appointment = await this.prisma.appointment.findFirst({
      where: {
        id: appointmentId,
        calendarId: calendar.id,
        status: AppointmentStatus.REQUESTED,
      },
      select: {
        id: true,
        patientName: true,
        description: true,
        startTime: true,
        endTime: true,
        metadata: true,
        googleCalendarEventId: true,
        googleCalendarHtmlLink: true,
        googleCalendarSyncedAt: true,
        googleCalendarSyncError: true,
        patient: {
          select: { id: true, fullName: true, email: true },
        },
      },
    });

    if (!appointment) {
      throw new NotFoundException('Cita solicitada no encontrada');
    }

    const updated = await this.prisma.appointment.update({
      where: { id: appointmentId },
      data: {
        status: AppointmentStatus.REJECTED,
        metadata: {
          ...(parseAppointmentMetadata(appointment.metadata) || {}),
          rejectedAt: new Date().toISOString(),
          rejectionReason: reason || null,
        },
      },
    });

    const recipientEmail =
      appointment.patient?.email ||
      (parseAppointmentMetadata(appointment.metadata)?.guestEmail as
        | string
        | undefined);
    const recipientName =
      appointment.patient?.fullName || appointment.patientName || 'Paciente';

    if (recipientEmail) {
      await this.sendAppointmentRejectedEmail({
        recipientEmail,
        recipientName,
        nutritionistName: calendar.nutritionist.fullName || calendar.name,
        timeZone: calendar.timeZone,
        appointmentDate: appointment.startTime,
        startTime: appointment.startTime,
        endTime: appointment.endTime,
        message: appointment.description,
        reason,
      });
    }

    return this.normalizeAppointment(updated);
  }
}
