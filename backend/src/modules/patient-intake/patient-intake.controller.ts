import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Query,
  Body,
  UseGuards,
  Request,
  BadRequestException,
} from '@nestjs/common';
import { AuthGuard } from '../auth/guards/auth.guard';
import { PermissionsGuard } from '../permissions/permissions.guard';
import { RequireFeatures } from '../permissions/permissions.decorator';
import { SPECIAL_FEATURES } from '../permissions/permissions.constants';
import { PatientIntakeService } from './patient-intake.service';
import { ReviewIntakeSubmissionDto } from './dto/review-intake-submission.dto';

@Controller('patient-intake')
@UseGuards(AuthGuard, PermissionsGuard)
@RequireFeatures(SPECIAL_FEATURES.MEMBERSHIP_SELECTED)
export class PatientIntakeController {
  constructor(private readonly intakeService: PatientIntakeService) {}

  @Get('link')
  async getMyIntakeLink(@Request() req: any) {
    const link = await this.intakeService.getIntakeLink(
      req.user.nutritionistId,
    );
    if (!link) {
      return { hasLink: false, status: null };
    }
    return { hasLink: true, status: link.status, token: link.token };
  }

  @Post('link')
  async createOrGetMyIntakeLink(@Request() req: any) {
    const link = await this.intakeService.getOrCreateIntakeLink(
      req.user.nutritionistId,
    );
    return link;
  }

  @Post('link/regenerate')
  async regenerateMyIntakeLink(@Request() req: any) {
    const link = await this.intakeService.regenerateIntakeLink(
      req.user.nutritionistId,
    );
    return link;
  }

  @Patch('link/status')
  async setMyIntakeLinkStatus(
    @Request() req: any,
    @Body() body: { status: 'ACTIVE' | 'DISABLED' },
  ) {
    if (!body.status || !['ACTIVE', 'DISABLED'].includes(body.status)) {
      throw new BadRequestException('Estado inválido');
    }
    return this.intakeService.setIntakeLinkStatus(
      req.user.nutritionistId,
      body.status,
    );
  }

  @Get('submissions')
  async getMySubmissions(
    @Request() req: any,
    @Query('status') status?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.intakeService.getSubmissions(
      req.user.nutritionistId,
      status,
      page ? +page : 1,
      limit ? +limit : 20,
    );
  }

  @Get('submissions/stats')
  async getMySubmissionStats(@Request() req: any) {
    return this.intakeService.getSubmissionStats(req.user.nutritionistId);
  }

  @Get('submissions/:id')
  async getMySubmission(@Request() req: any, @Param('id') id: string) {
    return this.intakeService.getSubmission(req.user.nutritionistId, id);
  }

  @Post('submissions/:id/review')
  async reviewMySubmission(
    @Request() req: any,
    @Param('id') id: string,
    @Body() dto: ReviewIntakeSubmissionDto,
  ) {
    return this.intakeService.reviewSubmission(
      req.user.nutritionistId,
      id,
      dto.action,
      dto.rejectReason,
    );
  }
}
