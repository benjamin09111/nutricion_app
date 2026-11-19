import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  Request,
  Res,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { AuthGuard } from '../auth/guards/auth.guard';
import { PatientPortalsService } from './patient-portals.service';
import { CreatePatientPortalInvitationDto } from './dto/create-patient-portal-invitation.dto';
import { CreatePatientPortalEntryDto } from './dto/create-patient-portal-entry.dto';
import { CreatePatientPortalQuestionDto } from './dto/create-patient-portal-question.dto';
import { CreatePatientPortalReplyDto } from './dto/create-patient-portal-reply.dto';
import { CreatePatientPortalNotificationDto } from './dto/create-patient-portal-notification.dto';
import { RequestAppointmentDto } from './dto/request-appointment.dto';
import {
  SendPortalInvitationEmailDto,
  PortalLoginDto,
  CreatePortalAdminMessageDto,
  SetPortalAccessStatusDto,
} from './dto/portal-request.dto';
import { PatientPortalAuthGuard } from './guards/patient-portal.guard';
import type { Response } from 'express';
import {
  PATIENT_PORTAL_SESSION_COOKIE,
  LEGACY_PATIENT_PORTAL_SESSION_COOKIE,
  patientPortalSessionCookieOptions,
} from './patient-portal-cookie.constants';
import { Audit } from '../../common/audit/audit.decorator';
import { AuditInterceptor } from '../../common/audit/audit.interceptor';
import { NutritionistScopeGuard } from '../../common/guards/nutritionist-scope.guard';

@Controller('patient-portals')
export class PatientPortalsController {
  constructor(private readonly patientPortalsService: PatientPortalsService) {}

  @UseGuards(AuthGuard, NutritionistScopeGuard)
  @Post('patients/:patientId/invitations')
  createInvitation(
    @Request() req: any,
    @Param('patientId') patientId: string,
    @Body() dto: CreatePatientPortalInvitationDto,
  ) {
    return this.patientPortalsService.createInvitation(
      req.user.nutritionistId,
      patientId,
      dto,
    );
  }

  @UseGuards(AuthGuard, NutritionistScopeGuard)
  @Post('patients/:patientId/invitations/send-email')
  sendInvitationEmail(
    @Request() req: any,
    @Param('patientId') patientId: string,
    @Body() body: SendPortalInvitationEmailDto,
  ) {
    return this.patientPortalsService.sendInvitationEmail(
      req.user.nutritionistId,
      patientId,
      body.email,
    );
  }

  @UseGuards(AuthGuard, NutritionistScopeGuard)
  @UseInterceptors(AuditInterceptor)
  @Get('patients/:patientId/overview')
  @Audit({ action: 'READ', resourceType: 'PATIENT_PORTAL' })
  getPatientOverview(
    @Request() req: any,
    @Param('patientId') patientId: string,
  ) {
    return this.patientPortalsService.getPortalOverview(
      req.user.nutritionistId,
      patientId,
    );
  }

  @UseGuards(AuthGuard, NutritionistScopeGuard)
  @Post('patients/:patientId/access-code/rotate')
  rotateAccessCode(@Request() req: any, @Param('patientId') patientId: string) {
    return this.patientPortalsService.rotateAccessCode(
      req.user.nutritionistId,
      patientId,
    );
  }

  @UseGuards(AuthGuard, NutritionistScopeGuard)
  @Get('follow-ups')
  getFollowUps(
    @Request() req: any,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    @Query('status') status?: string,
    @Query('documentId') documentId?: string,
    @Query('tags') tags?: string,
    @Query('pendingOnly') pendingOnly?: string,
  ) {
    return this.patientPortalsService.getFollowUps(req.user.nutritionistId, {
      page: page ? +page : 1,
      limit: limit ? +limit : 10,
      search,
      status,
      documentId,
      tags,
      pendingOnly: pendingOnly === 'true',
    });
  }

  @Get('invitations/:token/preview')
  previewInvitation(@Param('token') token: string) {
    return this.patientPortalsService.previewInvitation(token);
  }

  @Post('invitations/:token/verify')
  async verifyInvitation(
    @Param('token') token: string,
    @Body() body: PortalLoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const data = await this.patientPortalsService.verifyInvitation(
      token,
      body.email,
      body.accessCode,
    );

    res.cookie(
      PATIENT_PORTAL_SESSION_COOKIE,
      data.accessToken,
      patientPortalSessionCookieOptions(7 * 24 * 60 * 60 * 1000),
    );

    return data;
  }
  @Post('login')
  async login(
    @Body() body: PortalLoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const data = await this.patientPortalsService.login(
      body.email,
      body.accessCode,
    );

    res.cookie(
      PATIENT_PORTAL_SESSION_COOKIE,
      data.accessToken,
      patientPortalSessionCookieOptions(7 * 24 * 60 * 60 * 1000),
    );

    return data;
  }

  @UseGuards(PatientPortalAuthGuard)
  @UseInterceptors(AuditInterceptor)
  @Get('me')
  @Audit({ action: 'READ', resourceType: 'PATIENT_PORTAL' })
  getMyPortal(@Request() req: any) {
    return this.patientPortalsService.getPortalSessionOverview(
      req.portalSession,
    );
  }

  @UseGuards(PatientPortalAuthGuard)
  @Post('me/questions')
  createQuestion(
    @Request() req: any,
    @Body() dto: CreatePatientPortalQuestionDto,
  ) {
    return this.patientPortalsService.createQuestion(req.portalSession, dto);
  }

  @UseGuards(PatientPortalAuthGuard)
  @Post('me/tracking')
  createTracking(
    @Request() req: any,
    @Body() dto: CreatePatientPortalEntryDto,
  ) {
    return this.patientPortalsService.createTrackingEntry(
      req.portalSession,
      dto,
    );
  }

  @UseGuards(PatientPortalAuthGuard)
  @Post('me/journal')
  createJournal(@Request() req: any, @Body() dto: CreatePatientPortalEntryDto) {
    return this.patientPortalsService.createTrackingEntry(
      req.portalSession,
      dto,
    );
  }

  @UseGuards(PatientPortalAuthGuard)
  @Post('me/check-ins')
  createTrackingAlias(
    @Request() req: any,
    @Body() dto: CreatePatientPortalEntryDto,
  ) {
    return this.patientPortalsService.createTrackingEntry(
      req.portalSession,
      dto,
    );
  }

  @UseGuards(AuthGuard, NutritionistScopeGuard)
  @Post('patients/:patientId/replies')
  createReply(
    @Request() req: any,
    @Param('patientId') patientId: string,
    @Body() dto: CreatePatientPortalReplyDto,
  ) {
    return this.patientPortalsService.createReply(
      req.user.nutritionistId,
      patientId,
      dto,
    );
  }

  @UseGuards(AuthGuard, NutritionistScopeGuard)
  @Post('patients/:patientId/notifications')
  createNotification(
    @Request() req: any,
    @Param('patientId') patientId: string,
    @Body() dto: CreatePatientPortalNotificationDto,
  ) {
    return this.patientPortalsService.createNotification(
      req.user.nutritionistId,
      patientId,
      dto,
    );
  }

  @UseGuards(AuthGuard, NutritionistScopeGuard)
  @Post('patients/:patientId/messages')
  createMessage(
    @Request() req: any,
    @Param('patientId') patientId: string,
    @Body() body: CreatePortalAdminMessageDto,
  ) {
    return this.patientPortalsService.createPortalMessage(
      req.user.nutritionistId,
      patientId,
      body.message,
    );
  }

  @UseGuards(AuthGuard, NutritionistScopeGuard)
  @Post('patients/:patientId/access-status')
  setAccessStatus(
    @Request() req: any,
    @Param('patientId') patientId: string,
    @Body() body: SetPortalAccessStatusDto,
  ) {
    return this.patientPortalsService.setAccessStatus(
      req.user.nutritionistId,
      patientId,
      body.status,
    );
  }

  @UseGuards(PatientPortalAuthGuard)
  @Post('me/appointments/request')
  requestAppointment(@Request() req: any, @Body() dto: RequestAppointmentDto) {
    return this.patientPortalsService.requestAppointment(
      req.portalSession,
      dto,
    );
  }

  @Post('logout')
  logout(@Res({ passthrough: true }) res: Response) {
    res.clearCookie(
      PATIENT_PORTAL_SESSION_COOKIE,
      patientPortalSessionCookieOptions(),
    );
    res.clearCookie(
      LEGACY_PATIENT_PORTAL_SESSION_COOKIE,
      patientPortalSessionCookieOptions(),
    );
    return { success: true };
  }
}
