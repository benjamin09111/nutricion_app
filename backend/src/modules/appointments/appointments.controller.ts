import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  UseGuards,
  Headers,
  HttpCode,
  HttpStatus,
  Request,
} from '@nestjs/common';
import { AppointmentsService } from './appointments.service';
import { CreateCalendarDto } from './dto/create-calendar.dto';
import { UpdateScheduleDto } from './dto/update-schedule.dto';
import { ApiKeyGuard } from './api-key.guard';
import { PrismaService } from '../../prisma/prisma.service';

@Controller('calendars')
@UseGuards(ApiKeyGuard)
export class AppointmentsController {
  constructor(
    private readonly appointmentsService: AppointmentsService,
    private readonly prisma: PrismaService,
  ) {}

  private async getNutritionistIdFromRequest(request: any): Promise<string> {
    const headerId = request.headers['x-nutritionist-id'];
    
    const authHeader = request.headers['authorization'];
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      try {
        const jwt = require('jsonwebtoken');
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'change_me_local') as any;
        
        if (decoded?.sub) {
          const account = await this.prisma.account.findUnique({
            where: { id: decoded.sub },
            include: { nutritionist: true },
          });
          
          if (account?.nutritionist) {
            return account.nutritionist.id;
          }
        }
      } catch (e) {
      }
    }
    
    if (headerId) {
      return headerId;
    }
    
    throw new Error('No se pudo identificar al nutricionista');
  }

  @Get('me')
  async getMyCalendar(@Request() request: any) {
    const nutritionistId = await this.getNutritionistIdFromRequest(request);
    return this.appointmentsService.getMyCalendar(nutritionistId);
  }

  @Post('me')
  @HttpCode(HttpStatus.OK)
  async createOrGetCalendar(
    @Request() request: any,
    @Body() dto: CreateCalendarDto,
  ) {
    const nutritionistId = await this.getNutritionistIdFromRequest(request);
    const calendar = await this.appointmentsService.getOrCreateCalendar(nutritionistId);
    return this.appointmentsService.getCalendarWithSchedule(calendar.id, nutritionistId);
  }

  @Post('me/default-schedule')
  @HttpCode(HttpStatus.OK)
  async setDefaultSchedule(@Request() request: any) {
    const nutritionistId = await this.getNutritionistIdFromRequest(request);
    return this.appointmentsService.setDefaultSchedule(nutritionistId);
  }

  @Get(':id')
  async getCalendar(
    @Param('id') calendarId: string,
    @Request() request: any,
  ) {
    const nutritionistId = await this.getNutritionistIdFromRequest(request);
    return this.appointmentsService.getCalendarWithSchedule(calendarId, nutritionistId);
  }

  @Put(':id/schedule')
  async updateSchedule(
    @Param('id') calendarId: string,
    @Request() request: any,
    @Body() dto: UpdateScheduleDto,
  ) {
    const nutritionistId = await this.getNutritionistIdFromRequest(request);
    return this.appointmentsService.updateSchedule(calendarId, nutritionistId, dto);
  }

  @Put(':id/availability/rules')
  async updateAvailabilityRules(
    @Param('id') calendarId: string,
    @Request() request: any,
    @Body() body: { rules?: any[] },
  ) {
    const nutritionistId = await this.getNutritionistIdFromRequest(request);
    return this.appointmentsService.updateAvailabilityRules(calendarId, nutritionistId, body);
  }

  @Post(':id/booking-links')
  async createBookingLink(
    @Param('id') calendarId: string,
    @Request() request: any,
    @Body() body: { mode?: string; allowedUses?: number | null; expiresAt?: string | null; metadata?: Record<string, unknown>; fixedStartAt?: string; fixedEndAt?: string },
  ) {
    const nutritionistId = await this.getNutritionistIdFromRequest(request);
    const calendar = await this.appointmentsService.getCalendarById(calendarId, nutritionistId);
    return this.appointmentsService.createBookingLink(calendar.id, body || {});
  }

  @Get(':id/availability/rules')
  async getAvailabilityRules(
    @Param('id') calendarId: string,
    @Request() request: any,
  ) {
    const nutritionistId = await this.getNutritionistIdFromRequest(request);
    return this.appointmentsService.getAvailabilityRules(calendarId, nutritionistId);
  }
}
