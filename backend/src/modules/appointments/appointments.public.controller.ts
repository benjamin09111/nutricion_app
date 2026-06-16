import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { AppointmentsService } from './appointments.service';

@Controller()
export class AppointmentsPublicController {
  constructor(private readonly appointmentsService: AppointmentsService) {}

  @Get('booking-links/:token')
  async getBookingLink(@Param('token') token: string) {
    return this.appointmentsService.getBookingLinkByToken(token);
  }

  @Post('booking-links/:token/requests')
  async createBookingLinkRequest(
    @Param('token') token: string,
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
    const bookingLink = await this.appointmentsService.getBookingLinkByToken(token);

    const appointment = await this.appointmentsService.requestAppointment(
      bookingLink.nutritionistId,
      {
        calendarId: bookingLink.calendarId,
        nutritionistId: bookingLink.nutritionistId,
        guestName: body.guestName,
        guestEmail: body.guestEmail,
        guestPhone: body.guestPhone,
        message: body.message,
        start: body.startAt,
        end: body.endAt,
        source: 'booking-link',
      },
    );

    return {
      id: appointment.id,
      status: appointment.status,
      message: 'Tu solicitud de cita ha sido enviada. El nutricionista la revisará pronto.',
    };
  }

  @Get('booking-links/:token/availability/rules')
  async getBookingLinkAvailabilityRules(@Param('token') token: string) {
    const bookingLink =
      await this.appointmentsService.getBookingLinkByToken(token);
    return this.appointmentsService.getAvailabilityRules(
      bookingLink.calendarId,
      bookingLink.nutritionistId,
    );
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
