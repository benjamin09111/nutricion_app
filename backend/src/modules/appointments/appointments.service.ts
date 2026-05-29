import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import { AppointmentStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { UpdateScheduleDto, TimeSlotDto } from './dto/update-schedule.dto';
import { CreateAppointmentDto } from './dto/create-appointment.dto';

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

const WEEKDAY_INDEX_BY_NAME: Record<string, number> = {
  sunday: 0,
  monday: 1,
  tuesday: 2,
  wednesday: 3,
  thursday: 4,
  friday: 5,
  saturday: 6,
};

const extractDateKey = (value: string) => value.split('T')[0];

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

const localDateTimeToUtcIso = (
  dateKey: string,
  hour: number,
  timeZone: string,
) => {
  const { year, month, day } = parseDateKey(dateKey);
  let utcGuess = Date.UTC(year, month - 1, day, hour, 0, 0);

  for (let i = 0; i < 2; i += 1) {
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

    const delta = formattedAsUtc - utcGuess;
    if (delta === 0) break;
    utcGuess -= delta;
  }

  return new Date(utcGuess).toISOString();
};

@Injectable()
export class AppointmentsService {
  constructor(private readonly prisma: PrismaService) {}

  private normalizeAppointment(appointment: {
    id: string;
    calendarId: string;
    patientId: string | null;
    patientName?: string | null;
    title: string | null;
    description: string | null;
    startTime: Date;
    endTime: Date;
    status: AppointmentStatus;
    notes: string | null;
    meetingUrl?: string | null;
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
      start: appointment.startTime,
      end: appointment.endTime,
      status: appointment.status,
      notes: appointment.notes,
      meetingUrl: appointment.meetingUrl || null,
      createdAt: appointment.createdAt,
      updatedAt: appointment.updatedAt,
    };
  }

  async getOrCreateCalendar(
    nutritionistId: string,
  ): Promise<AppointmentCalendarWithNutritionist> {
    let calendar = await this.prisma.appointmentCalendar.findUnique({
      where: { nutritionistId },
      include: { nutritionist: true },
    });

    if (!calendar) {
      calendar = await this.prisma.appointmentCalendar.create({
        data: {
          nutritionistId,
          name: 'Mi Agenda',
          title: 'Calendario de Citas',
          timeZone: 'America/Santiago',
        },
        include: { nutritionist: true },
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
      include: { nutritionist: true },
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
      timeZone: calendar.timeZone,
      timezone: calendar.timeZone,
      metadata: bookingLink.metadata as Record<string, unknown> | null,
    };
  }

  async getBookingLinkByToken(token: string): Promise<BookingLinkRecord> {
    const bookingLink = await this.prisma.bookingLink.findUnique({
      where: { token },
      include: {
        calendar: {
          include: { nutritionist: true },
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
      timeZone: bookingLink.calendar.timeZone,
      timezone: bookingLink.calendar.timeZone,
      metadata: bookingLink.metadata as Record<string, unknown> | null,
    };
  }

  async getFreeSlots(
    query: FreeSlotQuery,
  ): Promise<{ slots: FreeSlotRecord[] }> {
    const calendar = await this.prisma.appointmentCalendar.findUnique({
      where: { id: query.calendarId },
      include: { timeSlots: true },
    });

    if (!calendar) {
      throw new NotFoundException('Calendario no encontrado');
    }

    const timeZone = calendar.timeZone || 'UTC';
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
        status: { not: AppointmentStatus.CANCELLED },
        startTime: { gte: new Date(`${fromKey}T00:00:00.000Z`) },
        endTime: { lte: new Date(`${toKey}T23:59:59.999Z`) },
      },
      select: { startTime: true },
    });
    const occupiedBlocks = new Set(
      blockingAppointments.map((appointment) =>
        getBlockKeyInTimeZone(appointment.startTime, timeZone),
      ),
    );

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
          const isBusy = occupiedBlocks.has(`${dateKey}-${slot.hour}`);
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
      include: { nutritionist: true },
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

    return {
      ...calendar,
      schedule: this.formatSchedule(timeSlots),
    };
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
      where.status = query.status.toUpperCase() as AppointmentStatus;
    }

    const appointments = await this.prisma.appointment.findMany({
      where,
      orderBy: { startTime: 'asc' },
    });

    return appointments.map((appointment) =>
      this.normalizeAppointment(appointment),
    );
  }

  async createAppointment(
    nutritionistId: string,
    dto: CreateAppointmentDto,
  ): Promise<AppointmentRecord> {
    const calendar = await this.getCalendarById(dto.calendarId, nutritionistId);
    const description = dto.description.trim();

    const patient = await this.prisma.patient.findFirst({
      where: {
        id: dto.patientId,
        nutritionistId,
      },
    });

    if (!patient) {
      throw new NotFoundException('Paciente no encontrado');
    }

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

    if (start.getTime() < Date.now() + 5 * 60 * 1000) {
      throw new BadRequestException(
        'La cita debe empezar al menos 5 minutos en el futuro',
      );
    }

    const blockRange = getBlockRangeInTimeZone(
      start,
      calendar.timeZone || dto.timeZone || 'UTC',
    );
    const blockingAppointment = await this.prisma.appointment.findFirst({
      where: {
        calendarId: calendar.id,
        status: { not: AppointmentStatus.CANCELLED },
        startTime: {
          gte: blockRange.start,
          lt: blockRange.end,
        },
      },
      select: { id: true },
    });

    if (blockingAppointment) {
      throw new BadRequestException('Ese bloque ya no está disponible');
    }

    const appointment = await this.prisma.appointment.create({
      data: {
        calendarId: calendar.id,
        patientId: patient.id,
        patientName: patient.fullName,
        title: dto.title?.trim() || description,
        description,
        startTime: start,
        endTime: end,
        status: AppointmentStatus.SCHEDULED,
        notes: dto.notes?.trim() || description,
      },
    });

    return this.normalizeAppointment(appointment);
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

  async getPendingAppointments(nutritionistId: string) {
    const calendar = await this.prisma.appointmentCalendar.findFirst({
      where: { nutritionistId },
      select: { id: true },
    });

    if (!calendar) {
      return [];
    }

    const appointments = await this.prisma.appointment.findMany({
      where: {
        calendarId: calendar.id,
        status: 'REQUESTED',
      },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        title: true,
        description: true,
        startTime: true,
        endTime: true,
        status: true,
        notes: true,
        createdAt: true,
        patient: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
      },
    });

    return appointments;
  }

  async approveAppointment(
    nutritionistId: string,
    appointmentId: string,
    startTime?: string,
    endTime?: string,
  ) {
    const calendar = await this.prisma.appointmentCalendar.findFirst({
      where: { nutritionistId },
      select: { id: true },
    });

    if (!calendar) {
      throw new NotFoundException('Calendario no encontrado');
    }

    const appointment = await this.prisma.appointment.findFirst({
      where: {
        id: appointmentId,
        calendarId: calendar.id,
        status: 'REQUESTED' as any,
      },
    });

    if (!appointment) {
      throw new NotFoundException('Cita solicitada no encontrada');
    }

    const updateData: any = {
      status: 'SCHEDULED' as const,
    };

    if (startTime && endTime) {
      updateData.startTime = new Date(startTime);
      updateData.endTime = new Date(endTime);
    }

    return this.prisma.appointment.update({
      where: { id: appointmentId },
      data: updateData,
    });
  }

  async rejectAppointment(nutritionistId: string, appointmentId: string) {
    const calendar = await this.prisma.appointmentCalendar.findFirst({
      where: { nutritionistId },
      select: { id: true },
    });

    if (!calendar) {
      throw new NotFoundException('Calendario no encontrado');
    }

    const appointment = await this.prisma.appointment.findFirst({
      where: {
        id: appointmentId,
        calendarId: calendar.id,
        status: 'REQUESTED' as any,
      },
    });

    if (!appointment) {
      throw new NotFoundException('Cita solicitada no encontrada');
    }

    return this.prisma.appointment.update({
      where: { id: appointmentId },
      data: { status: 'CANCELLED' as const },
    });
  }
}
