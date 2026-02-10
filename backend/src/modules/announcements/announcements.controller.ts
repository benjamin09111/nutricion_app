
import { Controller, Get, Post, Body, UseGuards, Request, UnauthorizedException } from '@nestjs/common';
import { AnnouncementsService } from './announcements.service';
import { CreateAnnouncementDto } from './dto/create-announcement.dto';
import { AuthGuard } from '@nestjs/passport';

@Controller('announcements')
export class AnnouncementsController {
    constructor(private readonly announcementsService: AnnouncementsService) { }

    @Post()
    @UseGuards(AuthGuard('jwt'))
    create(@Request() req: any, @Body() createAnnouncementDto: CreateAnnouncementDto) {
        const user = req.user;
        // Allow any admin role
        if (!['ADMIN', 'ADMIN_MASTER', 'ADMIN_GENERAL'].includes(user.role)) {
            throw new UnauthorizedException('No tienes permisos para crear anuncios');
        }
        return this.announcementsService.create(createAnnouncementDto);
    }

    @Get()
    @UseGuards(AuthGuard('jwt'))
    findAll() {
        return this.announcementsService.findAll();
    }
}
