import { Controller, Get, Post, Body, Patch, Param, UseGuards, UnauthorizedException, Request } from '@nestjs/common';
import { RequestsService } from './requests.service';
import { CreateRegistrationRequestDto } from './dto/create-registration-request.dto';
import { AuthGuard } from '@nestjs/passport';

@Controller('requests')
export class RequestsController {
    constructor(private readonly requestsService: RequestsService) { }

    @Post()
    create(@Body() createDto: CreateRegistrationRequestDto) {
        return this.requestsService.create(createDto);
    }

    @UseGuards(AuthGuard('jwt'))
    @Get()
    findAll(@Request() req: any) {
        if (!['ADMIN', 'ADMIN_MASTER', 'ADMIN_GENERAL'].includes(req.user.role)) {
            throw new UnauthorizedException('Solo el administrador puede ver las peticiones');
        }
        return this.requestsService.findAll();
    }

    @UseGuards(AuthGuard('jwt'))
    @Get('count/pending')
    getPendingCount(@Request() req: any) {
        if (!['ADMIN', 'ADMIN_MASTER', 'ADMIN_GENERAL'].includes(req.user.role)) {
            throw new UnauthorizedException('Solo el administrador puede ver las peticiones');
        }
        return this.requestsService.getPendingCount();
    }

    @UseGuards(AuthGuard('jwt'))
    @Patch(':id/status')
    updateStatus(
        @Param('id') id: string,
        @Body() body: { status: 'PENDING' | 'ACCEPTED' | 'APPROVED' | 'REJECTED'; adminNotes?: string },
        @Request() req: any,
    ) {
        if (!['ADMIN', 'ADMIN_MASTER', 'ADMIN_GENERAL'].includes(req.user.role)) {
            throw new UnauthorizedException('Solo el administrador puede gestionar peticiones');
        }
        return this.requestsService.updateStatus(id, body.status, body.adminNotes);
    }
}
