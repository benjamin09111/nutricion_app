import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  Request,
  UnauthorizedException,
} from '@nestjs/common';
import { AnnouncementsService } from './announcements.service';
import { CreateAnnouncementDto } from './dto/create-announcement.dto';
import { AuthGuard } from '../auth/guards/auth.guard';
import { PermissionsGuard } from '../permissions/permissions.guard';
import { RequireFeatures } from '../permissions/permissions.decorator';
import { SPECIAL_FEATURES, isAdminRole } from '../permissions/permissions.constants';

@Controller('announcements')
export class AnnouncementsController {
  constructor(private readonly announcementsService: AnnouncementsService) {}

  @Post()
  @UseGuards(AuthGuard, PermissionsGuard)
  @RequireFeatures(SPECIAL_FEATURES.MEMBERSHIP_SELECTED)
  create(
    @Request() req: any,
    @Body() createAnnouncementDto: CreateAnnouncementDto,
  ) {
    const user = req.user;
    // Allow any admin role
    if (!isAdminRole(user.role)) {
      throw new UnauthorizedException('No tienes permisos para crear anuncios');
    }
    return this.announcementsService.create(createAnnouncementDto);
  }

  @Get()
  @UseGuards(AuthGuard, PermissionsGuard)
  @RequireFeatures(SPECIAL_FEATURES.MEMBERSHIP_SELECTED)
  findAll() {
    return this.announcementsService.findAll();
  }
}
