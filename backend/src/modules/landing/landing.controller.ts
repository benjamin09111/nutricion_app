import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  UnauthorizedException,
  Headers,
} from '@nestjs/common';
import { LandingService } from './landing.service';
import { CreateLandingLeadDto } from './dto/create-landing-lead.dto';
import { CreateLandingEventDto } from './dto/create-landing-event.dto';
import { UpdateLandingLeadDto } from './dto/update-landing-lead.dto';
import { AuthGuard } from '../auth/guards/auth.guard';
import { PermissionsGuard } from '../permissions/permissions.guard';
import { RequireFeatures } from '../permissions/permissions.decorator';
import {
  SPECIAL_FEATURES,
  isStaffRole,
} from '../permissions/permissions.constants';

@Controller('landing')
export class LandingController {
  constructor(private readonly landingService: LandingService) {}

  // ==========================================
  // Public Endpoints (Landing Page)
  // ==========================================

  @Post('events')
  async trackEvent(
    @Body() dto: CreateLandingEventDto,
    @Headers('user-agent') userAgent?: string,
    @Headers('referer') referrer?: string,
  ) {
    return this.landingService.trackEvent(dto, userAgent, referrer);
  }

  @Post('leads')
  async createLead(
    @Body() dto: CreateLandingLeadDto & { sessionId?: string },
  ) {
    return this.landingService.createLead(dto, dto.sessionId);
  }

  // ==========================================
  // Admin Endpoints (Protected by Auth & Role)
  // ==========================================

  @UseGuards(AuthGuard, PermissionsGuard)
  @RequireFeatures(SPECIAL_FEATURES.MEMBERSHIP_SELECTED)
  @Get('admin/metrics')
  async getAdminMetrics(
    @Request() req: any,
    @Query('days') days?: string,
  ) {
    if (!isStaffRole(req.user?.role)) {
      throw new UnauthorizedException('No tienes permisos de administrador.');
    }
    return this.landingService.getAdminMetrics(days ? parseInt(days, 10) : 30);
  }

  @UseGuards(AuthGuard, PermissionsGuard)
  @RequireFeatures(SPECIAL_FEATURES.MEMBERSHIP_SELECTED)
  @Get('admin/leads')
  async getAdminLeads(
    @Request() req: any,
    @Query('search') search?: string,
    @Query('status') status?: string,
    @Query('practiceArea') practiceArea?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    if (!isStaffRole(req.user?.role)) {
      throw new UnauthorizedException('No tienes permisos de administrador.');
    }
    return this.landingService.getAdminLeads({
      search,
      status,
      practiceArea,
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 20,
    });
  }

  @UseGuards(AuthGuard, PermissionsGuard)
  @RequireFeatures(SPECIAL_FEATURES.MEMBERSHIP_SELECTED)
  @Patch('admin/leads/:id')
  async updateLead(
    @Param('id') id: string,
    @Body() dto: UpdateLandingLeadDto,
    @Request() req: any,
  ) {
    if (!isStaffRole(req.user?.role)) {
      throw new UnauthorizedException('No tienes permisos de administrador.');
    }
    return this.landingService.updateLead(id, dto);
  }

  @UseGuards(AuthGuard, PermissionsGuard)
  @RequireFeatures(SPECIAL_FEATURES.MEMBERSHIP_SELECTED)
  @Delete('admin/leads/:id')
  async deleteLead(
    @Param('id') id: string,
    @Request() req: any,
  ) {
    if (!isStaffRole(req.user?.role)) {
      throw new UnauthorizedException('No tienes permisos de administrador.');
    }
    return this.landingService.deleteLead(id);
  }
}
