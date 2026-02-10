import { Controller, Get, Post, Body, Patch, Param, UseGuards, UnauthorizedException, Request, Query, Delete } from '@nestjs/common';
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
    findAll(
        @Request() req: any,
        @Query('page') page?: string,
        @Query('limit') limit?: string,
        @Query('status') status?: 'PENDING' | 'ACCEPTED' | 'APPROVED' | 'REJECTED' | 'ALL_ACCEPTED',
        @Query('search') search?: string,
    ) {
        if (!['ADMIN', 'ADMIN_MASTER', 'ADMIN_GENERAL'].includes(req.user.role)) {
            throw new UnauthorizedException('Solo el administrador puede ver las peticiones');
        }
        return this.requestsService.findAll({
            page: page ? Number(page) : 1,
            limit: limit ? Number(limit) : 10,
            status,
            search
        });
    }

    @UseGuards(AuthGuard('jwt'))
    @Delete(':id')
    remove(@Param('id') id: string, @Request() req: any) {
        if (!['ADMIN', 'ADMIN_MASTER', 'ADMIN_GENERAL'].includes(req.user.role)) {
            throw new UnauthorizedException('Solo el administrador puede eliminar peticiones');
        }
        return this.requestsService.delete(id);
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
