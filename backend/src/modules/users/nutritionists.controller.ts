import { Controller, Get, Post, Body, UseGuards, Request } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { UsersService } from './users.service';
import { MailService } from '../mail/mail.service';

@Controller('nutritionists')
@UseGuards(AuthGuard('jwt'))
export class NutritionistsController {
  constructor(
    private readonly usersService: UsersService,
    private readonly mailService: MailService,
  ) {}

  @Get('me')
  async getMe(@Request() req: any) {
    const user = await this.usersService.findOne(req.user.id);
    return user?.nutritionist;
  }

  @Post('share-schedule')
  async shareSchedule(
    @Request() req: any,
    @Body() body: { email: string; bookingUrl: string; nutritionistName: string },
  ) {
    await this.mailService.sendBookingLinkEmail({
      email: body.email,
      nutritionistName: body.nutritionistName,
      bookingUrl: body.bookingUrl,
    });
    return { success: true };
  }
}
