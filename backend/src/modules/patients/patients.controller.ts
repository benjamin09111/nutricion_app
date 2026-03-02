import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request, Query, UseInterceptors } from '@nestjs/common';
import { PatientsService } from './patients.service';
import { CreatePatientDto } from './dto/create-patient.dto';
import { UpdatePatientDto } from './dto/update-patient.dto';
import { CreateExamDto } from './dto/create-exam.dto';
import { AuthGuard } from '@nestjs/passport';
import { HttpCacheInterceptor } from '../../common/interceptors/http-cache.interceptor';
import { CacheTTL } from '@nestjs/cache-manager';

@Controller('patients')
@UseGuards(AuthGuard('jwt'))
@UseInterceptors(HttpCacheInterceptor)
@CacheTTL(300000) // 5 minutes
export class PatientsController {
    constructor(private readonly patientsService: PatientsService) { }

    @Post()
    create(@Request() req: any, @Body() createPatientDto: CreatePatientDto) {
        return this.patientsService.create(req.user.nutritionistId, createPatientDto);
    }

    @Get()
    findAll(
        @Request() req: any,
        @Query('page') page?: string,
        @Query('limit') limit?: string,
        @Query('search') search?: string,
        @Query('status') status?: string,
    ) {
        return this.patientsService.findAll(
            req.user.nutritionistId,
            page ? +page : 1,
            limit ? +limit : 20,
            search,
            status,
        );
    }

    @Get(':id')
    findOne(@Request() req: any, @Param('id') id: string) {
        return this.patientsService.findOne(req.user.nutritionistId, id);
    }

    @Patch(':id')
    update(
        @Request() req: any,
        @Param('id') id: string,
        @Body() updatePatientDto: UpdatePatientDto,
    ) {
        return this.patientsService.update(req.user.nutritionistId, id, updatePatientDto);
    }

    @Delete(':id')
    remove(@Request() req: any, @Param('id') id: string) {
        return this.patientsService.remove(req.user.nutritionistId, id);
    }

    @Post(':id/exams')
    addExam(
        @Request() req: any,
        @Param('id') patientId: string,
        @Body() createExamDto: CreateExamDto,
    ) {
        return this.patientsService.addExam(req.user.nutritionistId, patientId, createExamDto);
    }
}
