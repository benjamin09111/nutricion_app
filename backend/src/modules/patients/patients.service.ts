import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreatePatientDto } from './dto/create-patient.dto';
import { UpdatePatientDto } from './dto/update-patient.dto';
import { CreateExamDto } from './dto/create-exam.dto';

import { CacheService } from '../../common/services/cache.service';

@Injectable()
export class PatientsService {
    constructor(
        private prisma: PrismaService,
        private cacheService: CacheService
    ) { }

    async create(nutritionistId: string, createPatientDto: CreatePatientDto) {
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

    async findAll(
        nutritionistId: string,
        page: number = 1,
        limit: number = 20,
        search?: string,
        status?: string,
        documentId?: string,
        tags?: string,
        startDate?: string,
        endDate?: string,
    ) {
        const skip = (page - 1) * limit;

        if (!nutritionistId) {
            return {
                data: [],
                meta: {
                    total: 0,
                    filteredTotal: 0,
                    activeCount: 0,
                    inactiveCount: 0,
                    page,
                    lastPage: 0,
                },
            };
        }

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

        if (documentId) {
            where.documentId = { contains: documentId, mode: 'insensitive' };
        }

        const parsedTags = tags
            ?.split(',')
            .map((tag) => tag.trim())
            .filter(Boolean);

        if (parsedTags && parsedTags.length > 0) {
            where.tags = { hasSome: parsedTags };
        }

        if (startDate || endDate) {
            where.createdAt = {};

            if (startDate) {
                const start = new Date(startDate);
                start.setHours(0, 0, 0, 0);
                where.createdAt.gte = start;
            }

            if (endDate) {
                const end = new Date(endDate);
                end.setHours(23, 59, 59, 999);
                where.createdAt.lte = end;
            }
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
                projects: {
                    orderBy: { updatedAt: 'desc' },
                    select: {
                        id: true,
                        name: true,
                        description: true,
                        mode: true,
                        status: true,
                        updatedAt: true,
                        activeDietCreation: {
                            select: {
                                id: true,
                                name: true,
                                type: true,
                            },
                        },
                        activeRecipeCreation: {
                            select: {
                                id: true,
                                name: true,
                                type: true,
                            },
                        },
                        activeDeliverableCreation: {
                            select: {
                                id: true,
                                name: true,
                                type: true,
                            },
                        },
                    },
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
