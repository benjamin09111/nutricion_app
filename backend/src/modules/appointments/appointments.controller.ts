import {
  Body,
  Controller,
  Get,
  Param,
  HttpCode,
  HttpStatus,
  Request,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { AppointmentsService } from './appointments.service';
import { UpdateScheduleDto } from './dto/update-schedule.dto';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { ApiKeyGuard } from './api-key.guard';
import { PrismaService } from '../../prisma/prisma.service';
import type { AppointmentRequest } from './appointments.types';
import { resolveNutritionistIdFromRequest } from './appointments-auth';

@Controller('calendars')
@UseGuards(ApiKeyGuard)
export class AppointmentsController {
  constructor(
    private readonly appointmentsService: AppointmentsService,
    private readonly prisma: PrismaService,
  ) {}

  @Get('me')
  async getMyCalendar(@Request() request: AppointmentRequest) {
    const nutritionistId = await resolveNutritionistIdFromRequest(
      request,
      this.prisma,
    );
    return this.appointmentsService.getMyCalendar(nutritionistId);
  }

  @Post('me')
  @HttpCode(HttpStatus.OK)
  async createOrGetCalendar(@Request() request: AppointmentRequest) {
    const nutritionistId = await resolveNutritionistIdFromRequest(
      request,
      this.prisma,
    );
    const calendar =
      await this.appointmentsService.getOrCreateCalendar(nutritionistId);
    return this.appointmentsService.getCalendarWithSchedule(
      calendar.id,
      nutritionistId,
    );
  }

  @Post('me/default-schedule')
  @HttpCode(HttpStatus.OK)
  async setDefaultSchedule(@Request() request: AppointmentRequest) {
    const nutritionistId = await resolveNutritionistIdFromRequest(
      request,
      this.prisma,
    );
    return this.appointmentsService.setDefaultSchedule(nutritionistId);
  }

  @Get(':id')
  async getCalendar(
    @Param('id') calendarId: string,
    @Request() request: AppointmentRequest,
  ) {
    const nutritionistId = await resolveNutritionistIdFromRequest(
      request,
      this.prisma,
    );
    return this.appointmentsService.getCalendarWithSchedule(
      calendarId,
      nutritionistId,
    );
  }

  @Put(':id/schedule')
  async updateSchedule(
    @Param('id') calendarId: string,
    @Request() request: AppointmentRequest,
    @Body() dto: UpdateScheduleDto,
  ) {
    const nutritionistId = await resolveNutritionistIdFromRequest(
      request,
      this.prisma,
    );
    return this.appointmentsService.updateSchedule(
      calendarId,
      nutritionistId,
      dto,
    );
  }

  @Put(':id/availability/rules')
  async updateAvailabilityRules(
    @Param('id') calendarId: string,
    @Request() request: AppointmentRequest,
    @Body()
    body: {
      rules?: Array<{
        dayOfWeek?: number;
        startTime?: string;
        endTime?: string;
        isAvailable?: boolean;
      }>;
    },
  ) {
    const nutritionistId = await resolveNutritionistIdFromRequest(
      request,
      this.prisma,
    );
    return this.appointmentsService.updateAvailabilityRules(
      calendarId,
      nutritionistId,
      body,
    );
  }

  @Post(':id/booking-links')
  async createBookingLink(
    @Param('id') calendarId: string,
    @Request() request: AppointmentRequest,
    @Body()
    body: {
      mode?: string;
      allowedUses?: number | null;
      expiresAt?: string | null;
      metadata?: Record<string, unknown>;
      fixedStartAt?: string;
      fixedEndAt?: string;
    },
  ) {
    const nutritionistId = await resolveNutritionistIdFromRequest(
      request,
      this.prisma,
    );
    const calendar = await this.appointmentsService.getCalendarById(
      calendarId,
      nutritionistId,
    );
    return this.appointmentsService.createBookingLink(calendar.id, body || {});
  }

  @Get(':id/availability/rules')
  async getAvailabilityRules(
    @Param('id') calendarId: string,
    @Request() request: AppointmentRequest,
  ) {
    const nutritionistId = await resolveNutritionistIdFromRequest(
      request,
      this.prisma,
    );
    return this.appointmentsService.getAvailabilityRules(
      calendarId,
      nutritionistId,
    );
  }

  @Post(':id/appointments')
  async createAppointment(
    @Param('id') calendarId: string,
    @Request() request: AppointmentRequest,
    @Body() body: Omit<CreateAppointmentDto, 'calendarId'>,
  ) {
    const nutritionistId = await resolveNutritionistIdFromRequest(
      request,
      this.prisma,
    );

    return this.appointmentsService.createAppointment(nutritionistId, {
      ...body,
      calendarId,
    });
  }

  @Get('appointments/pending')
  async getPendingAppointments(@Request() request: AppointmentRequest) {
    const nutritionistId = await resolveNutritionistIdFromRequest(
      request,
      this.prisma,
    );
    return this.appointmentsService.getPendingAppointments(nutritionistId);
  }

  @Post('appointments/:appointmentId/approve')
  async approveAppointment(
    @Param('appointmentId') appointmentId: string,
    @Request() request: AppointmentRequest,
    @Body() body: { startTime?: string; endTime?: string },
  ) {
    const nutritionistId = await resolveNutritionistIdFromRequest(
      request,
      this.prisma,
    );
    return this.appointmentsService.approveAppointment(
      nutritionistId,
      appointmentId,
      body.startTime,
      body.endTime,
    );
  }

  @Post('appointments/:appointmentId/reject')
  async rejectAppointment(
    @Param('appointmentId') appointmentId: string,
    @Request() request: AppointmentRequest,
  ) {
    const nutritionistId = await resolveNutritionistIdFromRequest(
      request,
      this.prisma,
    );
    return this.appointmentsService.rejectAppointment(nutritionistId, appointmentId);
  }
}
