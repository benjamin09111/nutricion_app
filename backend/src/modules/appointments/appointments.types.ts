import { AppointmentStatus, Prisma } from '@prisma/client';
import { Request } from 'express';
import * as jwt from 'jsonwebtoken';

export type AppointmentRequest = Request & {
  headers: Request['headers'] & {
    'x-nutritionist-id'?: string;
    authorization?: string;
    'x-api-key'?: string;
  };
};

export type NutritionistJwtPayload = jwt.JwtPayload & {
  nutritionistId?: string;
};

export type AppointmentCalendarWithNutritionist =
  Prisma.AppointmentCalendarGetPayload<{
    include: { nutritionist: { include: { account: true } } };
  }>;

export type AppointmentCalendarWithSchedule =
  AppointmentCalendarWithNutritionist & {
    schedule: Record<string, Record<number, { available: boolean }>>;
  };

export interface AppointmentRecord {
  id: string;
  calendarId: string;
  patientId: string | null;
  patientName: string | null;
  title: string | null;
  description: string | null;
  metadata: Record<string, unknown> | null;
  start: Date;
  end: Date;
  status: AppointmentStatus;
  notes: string | null;
  meetingUrl: string | null;
  googleCalendarEventId?: string | null;
  googleCalendarHtmlLink?: string | null;
  googleCalendarSyncedAt?: Date | null;
  googleCalendarSyncError?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface BookingLinkRecord {
  id: string;
  calendarId: string;
  token: string;
  url: string;
  allowedUses: number | null;
  expiresAt: Date | null;
  metadata: Record<string, unknown> | null;
  createdAt: Date;
  updatedAt: Date;
  nutritionistId: string;
  nutritionistName: string;
  title: string | null;
  description: string | null;
  timeZone: string | null;
  timezone: string | null;
}

export interface FreeSlotRecord {
  start: string;
  end: string;
  available: boolean;
  status: 'AVAILABLE' | 'BUSY';
}

export interface AvailabilityRuleRecord {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  isAvailable: boolean;
}

export interface AppointmentTimeSlotRecord {
  dayOfWeek: number;
  hour: number;
  isAvailable: boolean;
}
