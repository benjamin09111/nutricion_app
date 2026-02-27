"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConsultationsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
const cache_service_1 = require("../../common/services/cache.service");
let ConsultationsService = class ConsultationsService {
    prisma;
    cacheService;
    constructor(prisma, cacheService) {
        this.prisma = prisma;
        this.cacheService = cacheService;
    }
    async create(nutritionistId, createConsultationDto) {
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
        if (createConsultationDto.metrics) {
            await this.syncPatientData(createConsultationDto.patientId, createConsultationDto.metrics);
        }
        await this.cacheService.invalidateNutritionistPrefix(nutritionistId, 'consultations');
        await this.cacheService.invalidateNutritionistPrefix(nutritionistId, 'patients');
        return consultation;
    }
    async findAll(nutritionistId, page = 1, limit = 20, search, patientId, type) {
        const skip = (page - 1) * limit;
        const where = {
            nutritionistId,
        };
        if (type === 'CLINICAL' || !type) {
            where.title = { not: 'Registro de Métricas Independiente' };
        }
        else if (type === 'METRIC') {
            where.title = 'Registro de Métricas Independiente';
        }
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
    async findOne(nutritionistId, id) {
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
            throw new common_1.NotFoundException('Consulta no encontrada');
        }
        if (consultation.nutritionistId !== nutritionistId) {
            throw new common_1.ForbiddenException('No tienes permiso para acceder a esta consulta');
        }
        return {
            ...consultation,
            patientName: consultation.patient.fullName,
        };
    }
    async update(nutritionistId, id, updateConsultationDto) {
        const existing = await this.findOne(nutritionistId, id);
        const data = { ...updateConsultationDto };
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
        if (updateConsultationDto.metrics) {
            await this.syncPatientData(existing.patientId, updateConsultationDto.metrics);
        }
        await this.cacheService.invalidateNutritionistPrefix(nutritionistId, 'consultations');
        await this.cacheService.invalidateNutritionistPrefix(nutritionistId, 'patients');
        return consultation;
    }
    async syncPatientData(patientId, metrics) {
        const updates = {};
        for (const metric of metrics) {
            if (metric.key === 'weight' && metric.value) {
                const val = parseFloat(metric.value);
                if (!isNaN(val))
                    updates.weight = val;
            }
            if (metric.key === 'height' && metric.value) {
                const val = parseFloat(metric.value);
                if (!isNaN(val))
                    updates.height = val;
            }
        }
        if (Object.keys(updates).length > 0) {
            await this.prisma.patient.update({
                where: { id: patientId },
                data: updates,
            });
        }
    }
    async remove(nutritionistId, id) {
        await this.findOne(nutritionistId, id);
        const deleted = await this.prisma.consultation.delete({
            where: { id },
        });
        await this.cacheService.invalidateNutritionistPrefix(nutritionistId, 'consultations');
        await this.cacheService.invalidateNutritionistPrefix(nutritionistId, 'patients');
        return deleted;
    }
};
exports.ConsultationsService = ConsultationsService;
exports.ConsultationsService = ConsultationsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        cache_service_1.CacheService])
], ConsultationsService);
//# sourceMappingURL=consultations.service.js.map