import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request, Query, UseInterceptors } from '@nestjs/common';
import { ConsultationsService } from './consultations.service';
import { CreateConsultationDto } from './dto/create-consultation.dto';
import { UpdateConsultationDto } from './dto/update-consultation.dto';
import { AuthGuard } from '@nestjs/passport';
import { HttpCacheInterceptor } from '../../common/interceptors/http-cache.interceptor';
import { CacheTTL } from '@nestjs/cache-manager';

@Controller('consultations')
@UseGuards(AuthGuard('jwt'))
@UseInterceptors(HttpCacheInterceptor)
@CacheTTL(300000) // 5 minutes
export class ConsultationsController {
    constructor(private readonly consultationsService: ConsultationsService) { }

    @Post()
    create(@Request() req: any, @Body() createConsultationDto: CreateConsultationDto) {
        return this.consultationsService.create(req.user.nutritionistId, createConsultationDto);
    }

    @Get()
    findAll(
        @Request() req: any,
        @Query('page') page?: string,
        @Query('limit') limit?: string,
        @Query('search') search?: string,
        @Query('patientId') patientId?: string,
        @Query('type') type?: 'CLINICAL' | 'METRIC' | 'ALL',
    ) {
        return this.consultationsService.findAll(
            req.user.nutritionistId,
            page ? +page : 1,
            limit ? +limit : 20,
            search,
            patientId,
            type
        );
    }

    @Get(':id')
    findOne(@Request() req: any, @Param('id') id: string) {
        return this.consultationsService.findOne(req.user.nutritionistId, id);
    }

    @Patch(':id')
    update(
        @Request() req: any,
        @Param('id') id: string,
        @Body() updateConsultationDto: UpdateConsultationDto,
    ) {
        return this.consultationsService.update(req.user.nutritionistId, id, updateConsultationDto);
    }

    @Delete(':id')
    remove(@Request() req: any, @Param('id') id: string) {
        return this.consultationsService.remove(req.user.nutritionistId, id);
    }
}
