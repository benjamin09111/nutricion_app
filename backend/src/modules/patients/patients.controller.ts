import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
  Query,
  UseInterceptors,
} from '@nestjs/common';
import { PatientsService } from './patients.service';
import { CreatePatientDto } from './dto/create-patient.dto';
import { UpdatePatientDto } from './dto/update-patient.dto';
import { CreateExamDto } from './dto/create-exam.dto';
import { UpdateClinicalRecordDto } from './dto/update-clinical-record.dto';
import { AuthGuard } from '../auth/guards/auth.guard';
import { HttpCacheInterceptor } from '../../common/interceptors/http-cache.interceptor';
import { CacheTTL } from '@nestjs/cache-manager';
import { PermissionsGuard } from '../permissions/permissions.guard';
import { RequireFeatures } from '../permissions/permissions.decorator';
import { SPECIAL_FEATURES } from '../permissions/permissions.constants';

@Controller('patients')
@UseGuards(AuthGuard, PermissionsGuard)
@RequireFeatures(SPECIAL_FEATURES.MEMBERSHIP_SELECTED)
@UseInterceptors(HttpCacheInterceptor)
@CacheTTL(300000) // 5 minutes
export class PatientsController {
  constructor(private readonly patientsService: PatientsService) {}

  @Post()
  create(@Request() req: any, @Body() createPatientDto: CreatePatientDto) {
    return this.patientsService.create(
      req.user.id,
      req.user.nutritionistId,
      createPatientDto,
    );
  }

  @Get()
  findAll(
    @Request() req: any,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    @Query('status') status?: string,
    @Query('documentId') documentId?: string,
    @Query('tags') tags?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.patientsService.findAll(
      req.user.nutritionistId,
      page ? +page : 1,
      limit ? +limit : 20,
      search,
      status,
      documentId,
      tags,
      startDate,
      endDate,
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
    return this.patientsService.update(
      req.user.nutritionistId,
      id,
      updatePatientDto,
    );
  }

  @Post(':id/automatic-calculations')
  recalculateAutomaticNutrition(@Request() req: any, @Param('id') id: string) {
    return this.patientsService.recalculateAutomaticNutrition(
      req.user.nutritionistId,
      id,
    );
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
    return this.patientsService.addExam(
      req.user.nutritionistId,
      patientId,
      createExamDto,
    );
  }

  @Get(':id/clinical-record')
  getClinicalRecord(@Request() req: any, @Param('id') id: string) {
    return this.patientsService.getClinicalRecord(req.user.nutritionistId, id);
  }

  @Patch(':id/clinical-record')
  updateClinicalRecord(
    @Request() req: any,
    @Param('id') id: string,
    @Body() updateClinicalRecordDto: UpdateClinicalRecordDto,
  ) {
    return this.patientsService.updateClinicalRecord(
      req.user.nutritionistId,
      id,
      updateClinicalRecordDto,
    );
  }
}
