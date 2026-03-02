import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateConsultationDto } from './dto/create-consultation.dto';
import { UpdateConsultationDto } from './dto/update-consultation.dto';

import { CacheService } from '../../common/services/cache.service';

@Injectable()
export class ConsultationsService {
    constructor(
        private prisma: PrismaService,
        private cacheService: CacheService
    ) { }

    async create(nutritionistId: string, createConsultationDto: CreateConsultationDto) {
        const consultation = await this.prisma.consultation.create({
            data: {
                ...createConsultationDto,
                nutritionistId,
                date: new Date(createConsultationDto.date),
            },
            include: {
                patient: {
                    select: {
                        fullName: true,
                    },
                },
            },
        });

        // Sync patient data if metrics are present
        if (createConsultationDto.metrics) {
            await this.syncPatientData(createConsultationDto.patientId, createConsultationDto.metrics);
        }

        await this.cacheService.invalidateNutritionistPrefix(nutritionistId, 'consultations');
        await this.cacheService.invalidateNutritionistPrefix(nutritionistId, 'patients');
        return consultation;
    }

    async findAll(nutritionistId: string, page: number = 1, limit: number = 20, search?: string, patientId?: string, type?: 'CLINICAL' | 'METRIC' | 'ALL') {
        const skip = (page - 1) * limit;

        const where: any = {
            nutritionistId,
        };

        if (type === 'CLINICAL' || !type) {
            where.title = { not: 'Registro de Métricas Independiente' };
        } else if (type === 'METRIC') {
            where.title = 'Registro de Métricas Independiente';
        }
        // if type === 'ALL', we don't add the title filter

        if (patientId) {
            where.patientId = patientId;
        }

        if (search) {
            where.OR = [
                { title: { contains: search, mode: 'insensitive' } },
                { patient: { fullName: { contains: search, mode: 'insensitive' } } },
            ];
        }

        const [total, data] = await Promise.all([
            this.prisma.consultation.count({ where }),
            this.prisma.consultation.findMany({
                where,
                skip,
                take: limit,
                orderBy: { date: 'desc' },
                include: {
                    patient: {
                        select: {
                            fullName: true,
                        },
                    },
                },
            }),
        ]);

        return {
            data: data.map(item => ({
                ...item,
                patientName: item.patient.fullName,
            })),
            meta: {
                total,
                page,
                lastPage: Math.ceil(total / limit),
            },
        };
    }

    async findOne(nutritionistId: string, id: string) {
        const consultation = await this.prisma.consultation.findUnique({
            where: { id },
            include: {
                patient: {
                    select: {
                        fullName: true,
                    },
                },
            },
        });

        if (!consultation) {
            throw new NotFoundException('Consulta no encontrada');
        }

        if (consultation.nutritionistId !== nutritionistId) {
            throw new ForbiddenException('No tienes permiso para acceder a esta consulta');
        }

        return {
            ...consultation,
            patientName: consultation.patient.fullName,
        };
    }

    async update(nutritionistId: string, id: string, updateConsultationDto: UpdateConsultationDto) {
        const existing = await this.findOne(nutritionistId, id);

        const data: any = { ...updateConsultationDto };
        if (updateConsultationDto.date) {
            data.date = new Date(updateConsultationDto.date);
        }

        const consultation = await this.prisma.consultation.update({
            where: { id },
            data,
            include: {
                patient: {
                    select: {
                        fullName: true,
                    },
                },
            },
        });

        // Sync patient data if metrics are present
        if (updateConsultationDto.metrics) {
            await this.syncPatientData(existing.patientId, updateConsultationDto.metrics);
        }

        await this.cacheService.invalidateNutritionistPrefix(nutritionistId, 'consultations');
        await this.cacheService.invalidateNutritionistPrefix(nutritionistId, 'patients');
        return consultation;
    }

    private async syncPatientData(patientId: string, metrics: any[]) {
        const updates: any = {};

        for (const metric of metrics) {
            if (metric.key === 'weight' && metric.value) {
                const val = parseFloat(metric.value);
                if (!isNaN(val)) updates.weight = val;
            }
            if (metric.key === 'height' && metric.value) {
                const val = parseFloat(metric.value);
                if (!isNaN(val)) updates.height = val;
            }
        }

        if (Object.keys(updates).length > 0) {
            await this.prisma.patient.update({
                where: { id: patientId },
                data: updates,
            });
        }
    }

    async remove(nutritionistId: string, id: string) {
        await this.findOne(nutritionistId, id);

        const deleted = await this.prisma.consultation.delete({
            where: { id },
        });

        await this.cacheService.invalidateNutritionistPrefix(nutritionistId, 'consultations');
        await this.cacheService.invalidateNutritionistPrefix(nutritionistId, 'patients');
        return deleted;
    }
}
