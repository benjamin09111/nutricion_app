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
import { MailService } from '../mail/mail.service';

@Controller('public')
export class PublicController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly mailService: MailService,
  ) {}

  @Post('nutritionist-interest')
  async nutritionistInterest(
    @Body()
    body: {
      name: string;
      email: string;
    },
  ) {
    const { name, email } = body;

    if (!name?.trim() || !email?.trim()) {
      throw new BadRequestException('Nombre y email son requeridos');
    }

    if (!email.includes('@')) {
      throw new BadRequestException('Email inválido');
    }

    const existing = await this.prisma.nutritionistInterest.findFirst({
      where: { email: email.toLowerCase() },
    });

    if (existing) {
      return {
        success: true,
        message: 'Ya tenemos tu interés registrado. Te contactaremos pronto.',
      };
    }

    await this.prisma.nutritionistInterest.create({
      data: {
        name: name.trim(),
        email: email.toLowerCase().trim(),
      },
    });

    await this.mailService.sendNutritionistInterestNotification(name, email);

    return {
      success: true,
      message: 'Tu información ha sido recibida. Te contactaremos pronto.',
    };
  }
}

@Controller('public/nutritionists')
export class PublicNutritionistsController {
  constructor(
    private readonly usersService: UsersService,
    private readonly prisma: PrismaService,
    private readonly mailService: MailService,
  ) {}

  @Get()
  async listPublicNutritionists(
    @Query('search') search?: string,
    @Query('specialty') specialty?: string,
    @Query('mode') mode?: string,
    @Query('location') location?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.usersService.listPublicNutritionists({
      search,
      specialty,
      mode,
      location,
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
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

    const accountEmail =
      await this.prisma.account.findFirst({
        where: { nutritionist: { id: nutritionist.id } },
        select: { email: true },
      });

    if (accountEmail?.email) {
      await this.mailService.sendAppointmentRequestEmail({
        nutritionistEmail: accountEmail.email,
        nutritionistName: nutritionist.fullName,
        guestName: body.guestName,
        guestEmail: body.guestEmail,
        guestPhone: body.guestPhone,
        message: body.message,
        appointmentDate: start,
      });
    }

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
