import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreatePatientDto } from './dto/create-patient.dto';
import { UpdatePatientDto } from './dto/update-patient.dto';
import { CreateExamDto } from './dto/create-exam.dto';
import { TagsService } from '../tags/tags.service';
import { MetricsService } from '../metrics/metrics.service';

import { CacheService } from '../../common/services/cache.service';

@Injectable()
export class PatientsService {
    constructor(
        private prisma: PrismaService,
        private tagsService: TagsService,
        private metricsService: MetricsService,
        private cacheService: CacheService
    ) { }

    private async processTags(tags: string[], nutritionistId: string) {
        if (!tags || tags.length === 0) return;
        for (const tag of tags) {
            await this.tagsService.findOrCreate(tag, nutritionistId);
        }
    }

    private async processMetrics(metrics: { key: string; label: string; unit: string }[], nutritionistId: string) {
        if (!metrics || metrics.length === 0) return;
        for (const metric of metrics) {
            await this.metricsService.findOrCreate({
                key: metric.key,
                name: metric.label,
                unit: metric.unit
            }, nutritionistId);
        }
    }

    async create(nutritionistId: string, createPatientDto: CreatePatientDto) {
        if (createPatientDto.dietRestrictions) {
            await this.processTags(createPatientDto.dietRestrictions, nutritionistId);
        }

        if (createPatientDto.tags) {
            await this.processTags(createPatientDto.tags, nutritionistId);
        }

        if (createPatientDto.customVariables) {
            await this.processMetrics(createPatientDto.customVariables as any[], nutritionistId);
        }

        const patient = await this.prisma.patient.create({
            data: {
                ...createPatientDto,
                nutritionistId,
            },
        });

        await this.cacheService.invalidateNutritionistPrefix(nutritionistId, 'patients');
        await this.cacheService.invalidateNutritionistPrefix(nutritionistId, 'dashboard');
        return patient;
    }

    async findAll(nutritionistId: string, page: number = 1, limit: number = 20, search?: string, status?: string) {
        const skip = (page - 1) * limit;

        const where: any = {
            nutritionistId,
        };

        if (status && status !== 'Todos') {
            where.status = status === 'Activos' ? 'Active' : 'Inactive';
        }

        if (search) {
            where.OR = [
                { fullName: { contains: search, mode: 'insensitive' } },
                { email: { contains: search, mode: 'insensitive' } },
                { documentId: { contains: search, mode: 'insensitive' } },
            ];
        }

        const [filteredTotal, total, activeCount, inactiveCount, data] = await Promise.all([
            this.prisma.patient.count({ where }),
            this.prisma.patient.count({ where: { nutritionistId } }),
            this.prisma.patient.count({ where: { nutritionistId, status: 'Active' } }),
            this.prisma.patient.count({ where: { nutritionistId, status: 'Inactive' } }),
            this.prisma.patient.findMany({
                where,
                skip,
                take: limit,
                orderBy: { updatedAt: 'desc' },
            }),
        ]);

        return {
            data,
            meta: {
                total,
                filteredTotal,
                activeCount,
                inactiveCount,
                page,
                lastPage: Math.ceil(filteredTotal / limit),
            },
        };
    }

    async findOne(nutritionistId: string, id: string) {
        const patient = await this.prisma.patient.findUnique({
            where: { id },
            include: {
                consultations: {
                    orderBy: { date: 'asc' },
                },
                exams: {
                    orderBy: { date: 'desc' },
                },
            },
        });

        if (!patient) {
            throw new NotFoundException('Paciente no encontrado');
        }

        // IDOR PROTECTION: Ensure the patient belongs to the requesting nutritionist
        if (patient.nutritionistId !== nutritionistId) {
            throw new ForbiddenException('No tienes permiso para acceder a este paciente');
        }

        return patient;
    }

    async update(nutritionistId: string, id: string, updatePatientDto: UpdatePatientDto) {
        // Run check ownership first
        await this.findOne(nutritionistId, id);

        if (updatePatientDto.dietRestrictions) {
            await this.processTags(updatePatientDto.dietRestrictions, nutritionistId);
        }

        if (updatePatientDto.tags) {
            await this.processTags(updatePatientDto.tags, nutritionistId);
        }

        if (updatePatientDto.customVariables) {
            await this.processMetrics(updatePatientDto.customVariables as any[], nutritionistId);
        }

        const patient = await this.prisma.patient.update({
            where: { id },
            data: updatePatientDto,
        });

        await this.cacheService.invalidateNutritionistPrefix(nutritionistId, 'patients');
        await this.cacheService.invalidateNutritionistPrefix(nutritionistId, 'dashboard');
        return patient;
    }

    async remove(nutritionistId: string, id: string) {
        // Run check ownership first
        await this.findOne(nutritionistId, id);

        const deleted = await this.prisma.patient.delete({
            where: { id },
        });

        await this.cacheService.invalidateNutritionistPrefix(nutritionistId, 'patients');
        await this.cacheService.invalidateNutritionistPrefix(nutritionistId, 'dashboard');
        return deleted;
    }

    async addExam(nutritionistId: string, patientId: string, dto: CreateExamDto) {
        // Run check ownership first
        await this.findOne(nutritionistId, patientId);

        const exam = await this.prisma.patientExam.create({
            data: {
                ...dto,
                patientId,
                date: new Date(dto.date),
                results: dto.results as any, // Prisma Json compatibility
            },
        });

        await this.cacheService.invalidateNutritionistPrefix(nutritionistId, 'patients');
        return exam;
    }
}
