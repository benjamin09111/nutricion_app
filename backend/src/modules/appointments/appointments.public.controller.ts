import { Controller, Get, Param, Query } from '@nestjs/common';
import { AppointmentsService } from './appointments.service';

@Controller()
export class AppointmentsPublicController {
  constructor(private readonly appointmentsService: AppointmentsService) {}

  @Get('booking-links/:token')
  async getBookingLink(@Param('token') token: string) {
    return this.appointmentsService.getBookingLinkByToken(token);
  }

  @Get('booking-links/:token/availability/rules')
  async getBookingLinkAvailabilityRules(@Param('token') token: string) {
    const bookingLink = await this.appointmentsService.getBookingLinkByToken(token);
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
