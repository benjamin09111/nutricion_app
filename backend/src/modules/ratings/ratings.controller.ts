import {
  Body,
  Controller,
  Get,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '../auth/guards/auth.guard';
import { CreateRatingDto } from './dto/create-rating.dto';
import { RatingsService } from './ratings.service';

@Controller('ratings')
@UseGuards(AuthGuard)
export class RatingsController {
  constructor(private readonly ratingsService: RatingsService) {}

  @Get('status')
  getStatus(@Request() req: any) {
    return this.ratingsService.getStatus(req.user.id);
  }

  @Post()
  create(@Request() req: any, @Body() dto: CreateRatingDto) {
    return this.ratingsService.createRating(req.user.id, dto);
  }

  @Get('stats')
  getStats() {
    return this.ratingsService.getStats();
  }
}
