import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  UseGuards,
  Request,
  Delete,
} from '@nestjs/common';
import type { Request as ExpressRequest } from 'express';
import { SupportService } from './support.service';
import { CreateSupportRequestDto } from './dto/create-support-request.dto';
import { AuthGuard } from '../auth/guards/auth.guard';
import { PermissionsGuard } from '../permissions/permissions.guard';
import { RequireFeatures } from '../permissions/permissions.decorator';
import { SPECIAL_FEATURES } from '../permissions/permissions.constants';

type JwtRequest = ExpressRequest & {
  user: {
    email: string;
  };
};

@Controller('support')
export class SupportController {
  constructor(private readonly supportService: SupportService) {}

  private getUserEmail(req: JwtRequest): string {
    return (req as unknown as { user: { email: string } }).user.email;
  }

  // Public endpoint for submitting requests (Password Reset / Contact)
  @Post()
  create(@Body() body: CreateSupportRequestDto) {
    return this.supportService.create(body);
  }

  // Authenticated Feedback (uses JWT email)
  @UseGuards(AuthGuard, PermissionsGuard)
  @RequireFeatures(SPECIAL_FEATURES.MEMBERSHIP_SELECTED)
  @Post('feedback')
  createFeedback(
    @Request() req: JwtRequest,
    @Body() body: import('./dto/create-feedback.dto').CreateFeedbackDto,
  ) {
    return this.supportService.create({
      ...body,
      email: this.getUserEmail(req),
    });
  }

  // Secure Subscription Request
  @UseGuards(AuthGuard, PermissionsGuard)
  @RequireFeatures(SPECIAL_FEATURES.MEMBERSHIP_SELECTED)
  @Post('secure-subscription')
  secureSubscription(@Request() req: JwtRequest) {
    return this.supportService.create({
      email: this.getUserEmail(req),
      type: 'OTHER',
      subject: `ASEGURAR_SUSCRIPCION - ${this.getUserEmail(req)}`,
      message: `El nutricionista ${this.getUserEmail(req)} desea asegurar su suscripción post-beta.`,
    });
  }

  // Admin Only: List requests
  @UseGuards(AuthGuard, PermissionsGuard)
  @RequireFeatures(SPECIAL_FEATURES.MEMBERSHIP_SELECTED)
  @Get()
  findAll() {
    return this.supportService.findAll();
  }

  // Admin Only: Mark as resolved
  @UseGuards(AuthGuard, PermissionsGuard)
  @RequireFeatures(SPECIAL_FEATURES.MEMBERSHIP_SELECTED)
  @Patch(':id/resolve')
  resolve(
    @Param('id') id: string,
    @Body() body: { adminMessage?: string } | undefined,
  ) {
    return this.supportService.resolve(id, body?.adminMessage);
  }

  // Admin Only: Delete all resolved requests
  @UseGuards(AuthGuard, PermissionsGuard)
  @RequireFeatures(SPECIAL_FEATURES.MEMBERSHIP_SELECTED)
  @Delete('resolved')
  removeResolved() {
    return this.supportService.removeResolved();
  }

  // Admin Only: Delete request
  @UseGuards(AuthGuard, PermissionsGuard)
  @RequireFeatures(SPECIAL_FEATURES.MEMBERSHIP_SELECTED)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.supportService.remove(id);
  }
}
