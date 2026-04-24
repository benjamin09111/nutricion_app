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
const cache_service_1 = require("../../common/services/cache.service");
let PatientsService = class PatientsService {
    prisma;
    cacheService;
    constructor(prisma, cacheService) {
        this.prisma = prisma;
        this.cacheService = cacheService;
    }
    async create(nutritionistId, createPatientDto) {
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
    async findAll(nutritionistId, page = 1, limit = 20, search, status, documentId, tags, startDate, endDate) {
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
        cache_service_1.CacheService])
], PatientsService);
//# sourceMappingURL=patients.service.js.map