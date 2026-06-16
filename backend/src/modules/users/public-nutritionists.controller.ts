import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  BadRequestException,
  NotFoundException,
  GoneException,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { PrismaService } from '../../prisma/prisma.service';
import { MailService } from '../mail/mail.service';
import { AppointmentsService } from '../appointments/appointments.service';

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
    private readonly appointmentsService: AppointmentsService,
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
    const result =
      await this.usersService.resolvePublicNutritionistBySlug(slug);
    if (result.status === 'gone') {
      throw new GoneException('Este perfil ya no es público');
    }

    if (!result.profile) {
      throw new NotFoundException('Nutricionista no encontrado');
    }

    return this.usersService.getNutritionistAvailability(result.profile.id);
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
    const result =
      await this.usersService.resolvePublicNutritionistBySlug(slug);
    if (result.status === 'gone') {
      throw new GoneException('Este perfil ya no es público');
    }

    if (!result.profile) {
      throw new NotFoundException('Nutricionista no encontrado');
    }

    if (!result.profile.bookingEnabled) {
      throw new BadRequestException(
        'Este nutricionista no permite reservar citas en línea',
      );
    }

    const calendar = await this.prisma.appointmentCalendar.findUnique({
      where: { nutritionistId: result.profile.id },
    });

    if (!calendar) {
      throw new BadRequestException(
        'El nutricionista no tiene agenda configurada',
      );
    }

    const appointment = await this.appointmentsService.requestAppointment(
      result.profile.id,
      {
        calendarId: calendar.id,
        nutritionistId: result.profile.id,
        start: body.startAt,
        end: body.endAt,
        guestName: body.guestName,
        guestEmail: body.guestEmail,
        guestPhone: body.guestPhone,
        message: body.message,
        source: 'public-profile',
      },
    );

    return {
      id: appointment.id,
      status: appointment.status,
      message:
        'Tu solicitud de cita ha sido enviada. El nutricionista la revisará pronto.',
    };
  }

  @Get(':slug')
  async getPublicNutritionist(@Param('slug') slug: string) {
    const result =
      await this.usersService.resolvePublicNutritionistBySlug(slug);
    if (result.status === 'gone') {
      throw new GoneException('Este perfil ya no es público');
    }

    if (!result.profile) {
      throw new NotFoundException('Nutricionista no encontrado');
    }
    return result.profile;
  }
}
