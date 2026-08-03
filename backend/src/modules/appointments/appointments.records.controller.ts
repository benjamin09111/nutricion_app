import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { AppointmentsService } from './appointments.service';
import { ApiKeyGuard } from './api-key.guard';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import type { AppointmentRequest } from './appointments.types';
import { resolveNutritionistIdFromRequest } from './appointments-auth';
import { PermissionsGuard } from '../permissions/permissions.guard';
import { RequireFeatures } from '../permissions/permissions.decorator';
import { PLAN_ENTITLEMENT_KEYS } from '../memberships/plan-entitlements';

@Controller('appointments')
@UseGuards(ApiKeyGuard, PermissionsGuard)
export class AppointmentsRecordsController {
  constructor(
    private readonly appointmentsService: AppointmentsService,
    private readonly prisma: PrismaService,
  ) {}

  @Get()
  @RequireFeatures(PLAN_ENTITLEMENT_KEYS.APPOINTMENTS_ACCESS)
  async listAppointments(
    @Request() request: AppointmentRequest,
    @Query('calendarId') calendarId?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('status') status?: string,
  ) {
    const nutritionistId = await resolveNutritionistIdFromRequest(
      request,
      this.prisma,
    );
    return this.appointmentsService.listAppointments({
      nutritionistId,
      calendarId,
      from,
      to,
      status,
    });
  }

  @Post()
  @RequireFeatures(PLAN_ENTITLEMENT_KEYS.APPOINTMENTS_ACCESS)
  async createAppointment(
    @Request() request: AppointmentRequest,
    @Body() body: CreateAppointmentDto,
  ) {
    const nutritionistId = await resolveNutritionistIdFromRequest(
      request,
      this.prisma,
    );
    return this.appointmentsService.createAppointment(nutritionistId, body);
  }
}
