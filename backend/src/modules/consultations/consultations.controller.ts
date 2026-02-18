import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request, Query } from '@nestjs/common';
import { ConsultationsService } from './consultations.service';
import { CreateConsultationDto } from './dto/create-consultation.dto';
import { UpdateConsultationDto } from './dto/update-consultation.dto';
import { AuthGuard } from '@nestjs/passport';

@Controller('consultations')
@UseGuards(AuthGuard('jwt'))
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
    ) {
        return this.consultationsService.findAll(
            req.user.nutritionistId,
            page ? +page : 1,
            limit ? +limit : 20,
            search,
            patientId,
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
