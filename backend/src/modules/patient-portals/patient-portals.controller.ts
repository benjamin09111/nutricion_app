import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { PatientPortalsService } from './patient-portals.service';
import { CreatePatientPortalInvitationDto } from './dto/create-patient-portal-invitation.dto';
import { CreatePatientPortalEntryDto } from './dto/create-patient-portal-entry.dto';
import { CreatePatientPortalQuestionDto } from './dto/create-patient-portal-question.dto';
import { CreatePatientPortalReplyDto } from './dto/create-patient-portal-reply.dto';
import { CreatePatientPortalNotificationDto } from './dto/create-patient-portal-notification.dto';
import { PatientPortalAuthGuard } from './guards/patient-portal.guard';

@Controller('patient-portals')
export class PatientPortalsController {
  constructor(private readonly patientPortalsService: PatientPortalsService) {}

  @UseGuards(AuthGuard('jwt'))
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

  @UseGuards(AuthGuard('jwt'))
  @Get('patients/:patientId/overview')
  getPatientOverview(
    @Request() req: any,
    @Param('patientId') patientId: string,
  ) {
    return this.patientPortalsService.getPortalOverview(
      req.user.nutritionistId,
      patientId,
    );
  }

  @Get('invitations/:token/preview')
  previewInvitation(@Param('token') token: string) {
    return this.patientPortalsService.previewInvitation(token);
  }

  @Post('invitations/:token/verify')
  verifyInvitation(
    @Param('token') token: string,
    @Body() body: { email: string; accessCode: string },
  ) {
    return this.patientPortalsService.verifyInvitation(
      token,
      body.email,
      body.accessCode,
    );
  }
  @Post('login')
  login(@Body() body: { email: string; accessCode: string }) {
    return this.patientPortalsService.login(body.email, body.accessCode);
  }

  @UseGuards(PatientPortalAuthGuard)
  @Get('me')
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

  @UseGuards(AuthGuard('jwt'))
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

  @UseGuards(AuthGuard('jwt'))
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

  @UseGuards(AuthGuard('jwt'))
  @Post('patients/:patientId/messages')
  createMessage(
    @Request() req: any,
    @Param('patientId') patientId: string,
    @Body() body: { message: string },
  ) {
    return this.patientPortalsService.createPortalMessage(
      req.user.nutritionistId,
      patientId,
      body.message,
    );
  }

  @UseGuards(AuthGuard('jwt'))
  @Post('patients/:patientId/access-status')
  setAccessStatus(
    @Request() req: any,
    @Param('patientId') patientId: string,
    @Body() body: { status: 'ACTIVE' | 'BLOCKED' },
  ) {
    return this.patientPortalsService.setAccessStatus(
      req.user.nutritionistId,
      patientId,
      body.status,
    );
  }
}
