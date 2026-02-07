import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request, Query } from '@nestjs/common';
import { PatientsService } from './patients.service';
import { CreatePatientDto } from './dto/create-patient.dto';
import { UpdatePatientDto } from './dto/update-patient.dto';
import { AuthGuard } from '@nestjs/passport';

@Controller('patients')
@UseGuards(AuthGuard('jwt'))
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
    ) {
        return this.patientsService.findAll(
            req.user.nutritionistId,
            page ? +page : 1,
            limit ? +limit : 20,
            search,
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
}
