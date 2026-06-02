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
import { UsersService } from './users.service';
import { PrismaService } from '../../prisma/prisma.service';

@Controller('public/nutritionists')
export class PublicNutritionistsController {
  constructor(
    private readonly usersService: UsersService,
    private readonly prisma: PrismaService,
  ) {}

  @Get()
  async listPublicNutritionists(
    @Query('search') search?: string,
    @Query('specialty') specialty?: string,
    @Query('mode') mode?: string,
    @Query('location') location?: string,
  ) {
    return this.usersService.listPublicNutritionists({
      search,
      specialty,
      mode,
      location,
    });
  }

  @Get(':slug/availability')
  async getNutritionistAvailability(@Param('slug') slug: string) {
    const nutritionist =
      await this.usersService.getPublicNutritionistBySlug(slug);
    if (!nutritionist) {
      throw new NotFoundException('Nutricionista no encontrado');
    }
    return this.usersService.getNutritionistAvailability(nutritionist.id);
  }

  @Post(':slug/appointments/request')
  async requestAppointment(
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
        'Tu solicitud de cita ha sido enviada. El nutricionista la revisará pronto.',
    };
  }

  @Get(':slug')
  async getPublicNutritionist(@Param('slug') slug: string) {
    const nutritionist =
      await this.usersService.getPublicNutritionistBySlug(slug);
    if (!nutritionist) {
      throw new NotFoundException('Nutricionista no encontrado');
    }
    return nutritionist;
  }
}
