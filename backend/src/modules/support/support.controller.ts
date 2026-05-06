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
import { AuthGuard } from '@nestjs/passport';

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
  @UseGuards(AuthGuard('jwt'))
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
  @UseGuards(AuthGuard('jwt'))
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
  @UseGuards(AuthGuard('jwt'))
  @Get()
  findAll() {
    return this.supportService.findAll();
  }

  // Admin Only: Mark as resolved
  @UseGuards(AuthGuard('jwt'))
  @Patch(':id/resolve')
  resolve(@Param('id') id: string) {
    return this.supportService.resolve(id);
  }

  // Admin Only: Delete request
  @UseGuards(AuthGuard('jwt'))
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.supportService.remove(id);
  }
}
