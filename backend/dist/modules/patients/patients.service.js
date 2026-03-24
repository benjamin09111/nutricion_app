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
exports.PatientsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
const tags_service_1 = require("../tags/tags.service");
const metrics_service_1 = require("../metrics/metrics.service");
const cache_service_1 = require("../../common/services/cache.service");
let PatientsService = class PatientsService {
    prisma;
    tagsService;
    metricsService;
    cacheService;
    constructor(prisma, tagsService, metricsService, cacheService) {
        this.prisma = prisma;
        this.tagsService = tagsService;
        this.metricsService = metricsService;
        this.cacheService = cacheService;
    }
    async processTags(tags, nutritionistId) {
        if (!tags || tags.length === 0)
            return;
        for (const tag of tags) {
            await this.tagsService.findOrCreate(tag, nutritionistId);
        }
    }
    async processMetrics(metrics, nutritionistId) {
        if (!metrics || metrics.length === 0)
            return;
        for (const metric of metrics) {
            await this.metricsService.findOrCreate({
                key: metric.key,
                name: metric.label,
                unit: metric.unit
            }, nutritionistId);
        }
    }
    async create(nutritionistId, createPatientDto) {
        if (createPatientDto.dietRestrictions) {
            await this.processTags(createPatientDto.dietRestrictions, nutritionistId);
        }
        if (createPatientDto.tags) {
            await this.processTags(createPatientDto.tags, nutritionistId);
        }
        if (createPatientDto.customVariables) {
            await this.processMetrics(createPatientDto.customVariables, nutritionistId);
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
    async findAll(nutritionistId, page = 1, limit = 20, search, status) {
        const skip = (page - 1) * limit;
        const where = {
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
    async findOne(nutritionistId, id) {
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
            throw new common_1.NotFoundException('Paciente no encontrado');
        }
        if (patient.nutritionistId !== nutritionistId) {
            throw new common_1.ForbiddenException('No tienes permiso para acceder a este paciente');
        }
        return patient;
    }
    async update(nutritionistId, id, updatePatientDto) {
        await this.findOne(nutritionistId, id);
        if (updatePatientDto.dietRestrictions) {
            await this.processTags(updatePatientDto.dietRestrictions, nutritionistId);
        }
        if (updatePatientDto.tags) {
            await this.processTags(updatePatientDto.tags, nutritionistId);
        }
        if (updatePatientDto.customVariables) {
            await this.processMetrics(updatePatientDto.customVariables, nutritionistId);
        }
        const patient = await this.prisma.patient.update({
            where: { id },
            data: updatePatientDto,
        });
        await this.cacheService.invalidateNutritionistPrefix(nutritionistId, 'patients');
        await this.cacheService.invalidateNutritionistPrefix(nutritionistId, 'dashboard');
        return patient;
    }
    async remove(nutritionistId, id) {
        await this.findOne(nutritionistId, id);
        const deleted = await this.prisma.patient.delete({
            where: { id },
        });
        await this.cacheService.invalidateNutritionistPrefix(nutritionistId, 'patients');
        await this.cacheService.invalidateNutritionistPrefix(nutritionistId, 'dashboard');
        return deleted;
    }
    async addExam(nutritionistId, patientId, dto) {
        await this.findOne(nutritionistId, patientId);
        const exam = await this.prisma.patientExam.create({
            data: {
                ...dto,
                patientId,
                date: new Date(dto.date),
                results: dto.results,
            },
        });
        await this.cacheService.invalidateNutritionistPrefix(nutritionistId, 'patients');
        return exam;
    }
};
exports.PatientsService = PatientsService;
exports.PatientsService = PatientsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        tags_service_1.TagsService,
        metrics_service_1.MetricsService,
        cache_service_1.CacheService])
], PatientsService);
//# sourceMappingURL=patients.service.js.map