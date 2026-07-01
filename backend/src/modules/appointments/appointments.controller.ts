import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  Request,
  Post,
  Put,
  Patch,
  UseGuards,
  Res,
  BadRequestException,
} from '@nestjs/common';
import { AppointmentsService } from './appointments.service';
import { UpdateScheduleDto } from './dto/update-schedule.dto';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { ApiKeyGuard } from './api-key.guard';
import { PrismaService } from '../../prisma/prisma.service';
import type { AppointmentRequest } from './appointments.types';
import { resolveNutritionistIdFromRequest } from './appointments-auth';
import { GoogleIntegrationService } from '../integrations/google-integration.service';
import type { Response } from 'express';

@Controller('calendars')
@UseGuards(ApiKeyGuard)
export class AppointmentsController {
  constructor(
    private readonly appointmentsService: AppointmentsService,
    private readonly prisma: PrismaService,
    private readonly googleIntegrationService: GoogleIntegrationService,
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

  @Get('google/callback')
  async googleCalendarCallback(
    @Query('code') code: string,
    @Query('state') state: string,
    @Res() res: Response,
  ) {
    if (!code || !state) {
      throw new BadRequestException('Callback de Google Calendar incompleto');
    }

    const callback =
      await this.googleIntegrationService.handleGoogleCalendarCallback(
        code,
        state,
      );

    await this.googleIntegrationService.upsertCalendarConnection({
      accountId: callback.accountId,
      profile: callback.profile,
      tokens: callback.tokens,
    });

    const frontendUrl = (
      process.env.FRONTEND_URL || 'http://localhost:3000'
    ).replace(/\/$/, '');
    return res.redirect(
      `${frontendUrl}${callback.next || '/dashboard/citas'}?googleCalendar=connected`,
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

  @Get(':id/requests')
  async getCalendarRequests(
    @Param('id') calendarId: string,
    @Request() request: AppointmentRequest,
  ) {
    const nutritionistId = await resolveNutritionistIdFromRequest(
      request,
      this.prisma,
    );

    return this.appointmentsService.listAppointments({
      nutritionistId,
      calendarId,
      status: 'REQUESTED',
    });
  }

  @Get(':id/view/week')
  async getWeekView(
    @Param('id') calendarId: string,
    @Request() request: AppointmentRequest,
    @Query('weekStart') weekStart: string,
  ) {
    const nutritionistId = await resolveNutritionistIdFromRequest(
      request,
      this.prisma,
    );

    return this.appointmentsService.getWeekView(
      calendarId,
      nutritionistId,
      weekStart,
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

  @Post(':id/google/connect')
  async connectGoogleCalendar(
    @Param('id') calendarId: string,
    @Request() request: AppointmentRequest,
  ) {
    const nutritionistId = await resolveNutritionistIdFromRequest(
      request,
      this.prisma,
    );
    const accountId = (request as any).user?.id as string | undefined;

    if (!accountId) {
      return { authUrl: null };
    }

    const authUrl = this.googleIntegrationService.buildGoogleCalendarConnectUrl(
      {
        accountId,
        nutritionistId,
        calendarId,
        next: '/dashboard/citas',
      },
    );

    return { authUrl };
  }

  @Get(':id/google/status')
  async getGoogleStatus(
    @Param('id') calendarId: string,
    @Request() request: AppointmentRequest,
  ) {
    const nutritionistId = await resolveNutritionistIdFromRequest(
      request,
      this.prisma,
    );

    const calendar = await this.appointmentsService.getCalendarById(
      calendarId,
      nutritionistId,
    );

    const status = await this.googleIntegrationService.getConnectionStatus(
      calendar.nutritionist.account.id,
    );

    return {
      ...status,
      googleCalendarConnected: status.connected,
      googleSyncEnabled: status.connected,
      isGoogleConnected: status.connected,
    };
  }

  @Post(':id/google/resync')
  async resyncGoogleCalendar(
    @Param('id') calendarId: string,
    @Request() request: AppointmentRequest,
  ) {
    const nutritionistId = await resolveNutritionistIdFromRequest(
      request,
      this.prisma,
    );

    await this.appointmentsService.getCalendarById(calendarId, nutritionistId);
    return this.googleIntegrationService.resyncAppointments(calendarId);
  }

  @Delete(':id/google/disconnect')
  async disconnectGoogleCalendar(
    @Param('id') calendarId: string,
    @Request() request: AppointmentRequest,
  ) {
    const nutritionistId = await resolveNutritionistIdFromRequest(
      request,
      this.prisma,
    );

    await this.appointmentsService.getCalendarById(calendarId, nutritionistId);

    const accountId = (request as any).user?.id as string | undefined;
    if (!accountId) {
      throw new BadRequestException('No se pudo identificar la cuenta');
    }

    await this.googleIntegrationService.disconnectCalendarConnection(accountId);

    return { success: true };
  }

  @Patch(':id/google/integration')
  async updateGoogleIntegration(
    @Param('id') calendarId: string,
    @Request() request: AppointmentRequest,
    @Body() body: Record<string, unknown>,
  ) {
    const nutritionistId = await resolveNutritionistIdFromRequest(
      request,
      this.prisma,
    );

    const calendar = await this.appointmentsService.getCalendarById(
      calendarId,
      nutritionistId,
    );

    const currentMetadata =
      calendar.metadata &&
      typeof calendar.metadata === 'object' &&
      !Array.isArray(calendar.metadata)
        ? (calendar.metadata as Record<string, unknown>)
        : {};

    const updated = await this.prisma.appointmentCalendar.update({
      where: { id: calendar.id },
      data: {
        metadata: {
          ...currentMetadata,
          googleIntegration: {
            ...(currentMetadata.googleIntegration as
              | Record<string, unknown>
              | undefined),
            ...body,
          },
        } as any,
      },
    });

    return updated;
  }

  @Get(':id/google/diagnostics')
  async getGoogleDiagnostics(
    @Param('id') calendarId: string,
    @Request() request: AppointmentRequest,
  ) {
    const nutritionistId = await resolveNutritionistIdFromRequest(
      request,
      this.prisma,
    );

    const calendar = await this.appointmentsService.getCalendarById(
      calendarId,
      nutritionistId,
    );

    const status = await this.googleIntegrationService.getConnectionStatus(
      calendar.nutritionist.account.id,
    );

    return {
      status,
      calendarId: calendar.id,
      nutritionistId,
    };
  }

  @Post('appointments/:appointmentId/approve')
  async approveAppointment(
    @Param('appointmentId') appointmentId: string,
    @Request() request: AppointmentRequest,
    @Body()
    body: {
      startTime?: string;
      endTime?: string;
      notifyPatientByEmail?: boolean;
      syncGoogleCalendar?: boolean;
    },
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
      body.notifyPatientByEmail,
      body.syncGoogleCalendar,
    );
  }

  @Post('appointments/:appointmentId/reject')
  async rejectAppointment(
    @Param('appointmentId') appointmentId: string,
    @Request() request: AppointmentRequest,
    @Body() body: { reason?: string },
  ) {
    const nutritionistId = await resolveNutritionistIdFromRequest(
      request,
      this.prisma,
    );
    return this.appointmentsService.rejectAppointment(
      nutritionistId,
      appointmentId,
      body?.reason,
    );
  }

  @Post('appointments/:appointmentId/cancel')
  async cancelAppointment(
    @Param('appointmentId') appointmentId: string,
    @Request() request: AppointmentRequest,
  ) {
    const nutritionistId = await resolveNutritionistIdFromRequest(
      request,
      this.prisma,
    );

    return this.appointmentsService.cancelAppointment(
      nutritionistId,
      appointmentId,
    );
  }
}
