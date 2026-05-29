import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { AppointmentsService } from './appointments.service';
import { PrismaService } from '../../prisma/prisma.service';
import { UsersService } from '../users/users.service';

@Controller('public')
export class PublicAppointmentsController {
  constructor(
    private readonly appointmentsService: AppointmentsService,
    private readonly prisma: PrismaService,
    private readonly usersService: UsersService,
  ) {}

  @Get('nutritionists/:slug/availability')
  async getPublicAvailability(@Param('slug') slug: string) {
    const nutritionist =
      await this.usersService.getPublicNutritionistBySlug(slug);
    if (!nutritionist) {
      throw new NotFoundException('Nutricionista no encontrado');
    }

    return this.usersService.getNutritionistAvailability(nutritionist.id);
  }

  @Post('nutritionists/:slug/appointments/request')
  async requestPublicAppointment(
    @Param('slug') slug: string,
    @Body()
    body: {
      guestName: string;
      guestEmail: string;
      guestPhone?: string;
      message?: string;
      startAt: string;
      endAt: string;
    },
  ) {
    const nutritionist =
      await this.usersService.getPublicNutritionistBySlug(slug);
    if (!nutritionist) {
      throw new NotFoundException('Nutricionista no encontrado');
    }

    if (!nutritionist.bookingEnabled) {
      throw new BadRequestException(
        'Este nutricionista no permite reservar citas en línea',
      );
    }

    const calendar = await this.prisma.appointmentCalendar.findUnique({
      where: { nutritionistId: nutritionist.id },
    });

    if (!calendar) {
      throw new BadRequestException(
        'El nutricionista no tiene agenda configurada',
      );
    }

    const start = new Date(body.startAt);
    const end = new Date(body.endAt);

    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      throw new BadRequestException('Fechas inválidas');
    }

    const blockingAppointment = await this.prisma.appointment.findFirst({
      where: {
        calendarId: calendar.id,
        status: { not: 'CANCELLED' },
        startTime: { lte: end },
        endTime: { gte: start },
      },
      select: { id: true },
    });

    if (blockingAppointment) {
      throw new BadRequestException('El horario ya no está disponible');
    }

    const appointment = await this.prisma.appointment.create({
      data: {
        calendarId: calendar.id,
        patientId: null,
        patientName: body.guestName,
        title: `Solicitud de cita - ${body.guestName}`,
        description: body.message || 'Solicitud de cita desde portal público',
        startTime: start,
        endTime: end,
        status: 'REQUESTED' as any,
        notes: JSON.stringify({
          guestEmail: body.guestEmail,
          guestPhone: body.guestPhone || null,
          source: 'public-portal',
        }),
      },
    });

    return {
      id: appointment.id,
      status: appointment.status,
      message:
        'Tu solicitud de cita ha sido enviada. El nutritionist la revisará pronto.',
    };
  }

  @Get('availability/free-slots')
  async getFreeSlots(
    @Query('calendarId') calendarId: string,
    @Query('from') from: string,
    @Query('to') to: string,
    @Query('durationMin') durationMin?: string,
  ) {
    return this.appointmentsService.getFreeSlots({
      calendarId,
      from,
      to,
      durationMin: durationMin ? Number(durationMin) : undefined,
    });
  }
}
