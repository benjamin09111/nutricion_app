import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateCalendarDto } from './dto/create-calendar.dto';
import { UpdateScheduleDto, TimeSlotDto } from './dto/update-schedule.dto';

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

const localDateTimeToUtcIso = (dateKey: string, hour: number, timeZone: string) => {
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

  async getOrCreateCalendar(nutritionistId: string): Promise<any> {
    let calendar = await this.prisma.appointmentCalendar.findUnique({
      where: { nutritionistId },
    });

    if (!calendar) {
      calendar = await this.prisma.appointmentCalendar.create({
        data: {
          nutritionistId,
          name: 'Mi Agenda',
          title: 'Calendario de Citas',
          timeZone: 'America/Santiago',
        },
      });
    }

    return calendar;
  }

  async createBookingLink(calendarId: string, payload: CreateBookingLinkPayload): Promise<any> {
    const calendar = await this.prisma.appointmentCalendar.findUnique({
      where: { id: calendarId },
      include: { nutritionist: true },
    });

    if (!calendar) {
      throw new NotFoundException('Calendario no encontrado');
    }

    const token = randomUUID();
    const frontendUrl = (process.env.FRONTEND_URL || process.env.NEXT_PUBLIC_FRONTEND_URL || '').replace(/\/$/, '');
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
    };
  }

  async getBookingLinkByToken(token: string): Promise<any> {
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
      nutritionistName: bookingLink.calendar.nutritionist?.fullName || bookingLink.calendar.name,
      title: bookingLink.calendar.title,
      description: bookingLink.calendar.description,
      timeZone: bookingLink.calendar.timeZone,
      timezone: bookingLink.calendar.timeZone,
    };
  }

  async getFreeSlots(query: FreeSlotQuery): Promise<any> {
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
    const slots: Array<{ start: string; end: string; available: boolean; status: string }> = [];

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

        if (slotStart.getTime() >= new Date(`${fromKey}T00:00:00.000Z`).getTime() && slotEnd.getTime() <= new Date(`${toKey}T23:59:59.999Z`).getTime()) {
          slots.push({
            start: slotStart.toISOString(),
            end: slotEnd.toISOString(),
            available: true,
            status: 'AVAILABLE',
          });
        }
      }

      current.setDate(current.getDate() + 1);
    }

    return { slots };
  }

  async getCalendarById(calendarId: string, nutritionistId: string): Promise<any> {
    const calendar = await this.prisma.appointmentCalendar.findFirst({
      where: {
        id: calendarId,
        nutritionistId,
      },
    });

    if (!calendar) {
      throw new NotFoundException('Calendario no encontrado');
    }

    return calendar;
  }

  async getMyCalendar(nutritionistId: string): Promise<any> {
    const calendar = await this.getOrCreateCalendar(nutritionistId);
    return this.getCalendarWithSchedule(calendar.id, nutritionistId);
  }

  async getCalendarWithSchedule(calendarId: string, nutritionistId: string): Promise<any> {
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

  private formatSchedule(slots: any[]): Record<string, any> {
    const schedule: Record<string, any> = {};
    
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
  ): Promise<any> {
    const calendar = await this.getCalendarById(calendarId, nutritionistId);

    const existingSlots = await this.prisma.appointmentTimeSlot.findMany({
      where: { calendarId },
    });

    const existingMap = new Map(
      existingSlots.map(s => [`${s.dayOfWeek}-${s.hour}`, s.id])
    );

    const upsertPromises: Promise<any>[] = [];

    for (const slot of dto.slots) {
      const key = `${slot.dayOfWeek}-${slot.hour}`;
      const existingId = existingMap.get(key);

      if (existingId) {
        upsertPromises.push(
          this.prisma.appointmentTimeSlot.update({
            where: { id: existingId },
            data: { isAvailable: slot.isAvailable },
          })
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
          })
        );
      }
    }

    await Promise.all(upsertPromises);

    return this.getCalendarWithSchedule(calendarId, nutritionistId);
  }

  async setDefaultSchedule(nutritionistId: string): Promise<any> {
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

    return this.updateSchedule(calendar.id, nutritionistId, { slots: defaultSlots });
  }

  async updateAvailabilityRules(
    calendarId: string,
    nutritionistId: string,
    payload: AvailabilityRulePayload,
  ): Promise<any> {
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
        data: slots.map(slot => ({
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
  ): Promise<any> {
    const calendar = await this.getCalendarById(calendarId, nutritionistId);

    const timeSlots = await this.prisma.appointmentTimeSlot.findMany({
      where: { calendarId, isAvailable: true },
      orderBy: [{ dayOfWeek: 'asc' }, { hour: 'asc' }],
    });

    const rules: any[] = [];
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
}
