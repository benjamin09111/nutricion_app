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
exports.ProjectsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
const cache_service_1 = require("../../common/services/cache.service");
let ProjectsService = class ProjectsService {
    prisma;
    cacheService;
    constructor(prisma, cacheService) {
        this.prisma = prisma;
        this.cacheService = cacheService;
    }
    projectInclude = {
        patient: {
            select: {
                id: true,
                fullName: true,
                email: true,
                weight: true,
                height: true,
                dietRestrictions: true,
            },
        },
        activeDietCreation: {
            select: { id: true, name: true, type: true, updatedAt: true },
        },
        activeRecipeCreation: {
            select: { id: true, name: true, type: true, updatedAt: true },
        },
        activeCartCreation: {
            select: { id: true, name: true, type: true, updatedAt: true },
        },
        activeDeliverableCreation: {
            select: { id: true, name: true, type: true, updatedAt: true },
        },
    };
    async validatePatientOwnership(nutritionistId, patientId) {
        if (!patientId)
            return;
        const patient = await this.prisma.patient.findUnique({
            where: { id: patientId },
            select: { id: true, nutritionistId: true },
        });
        if (!patient) {
            throw new common_1.NotFoundException('Paciente no encontrado');
        }
        if (patient.nutritionistId !== nutritionistId) {
            throw new common_1.ForbiddenException('No tienes permiso para usar este paciente en el proyecto');
        }
    }
    async validateCreationOwnership(nutritionistId, creationId, expectedType) {
        if (!creationId)
            return;
        const creation = await this.prisma.creation.findUnique({
            where: { id: creationId },
            select: { id: true, nutritionistId: true, type: true },
        });
        if (!creation) {
            throw new common_1.NotFoundException('La creación vinculada no existe');
        }
        if (creation.nutritionistId !== nutritionistId) {
            throw new common_1.ForbiddenException('No tienes permiso para usar esta creación en el proyecto');
        }
        if (creation.type !== expectedType) {
            throw new common_1.ForbiddenException(`La creación ${creationId} no corresponde al módulo ${expectedType}`);
        }
    }
    async validateOwnerships(nutritionistId, dto) {
        await this.validatePatientOwnership(nutritionistId, dto.patientId);
        await this.validateCreationOwnership(nutritionistId, dto.activeDietCreationId, 'DIET');
        await this.validateCreationOwnership(nutritionistId, dto.activeRecipeCreationId, 'RECIPE');
        await this.validateCreationOwnership(nutritionistId, dto.activeCartCreationId, 'SHOPPING_LIST');
        await this.validateCreationOwnership(nutritionistId, dto.activeDeliverableCreationId, 'DELIVERABLE');
    }
    async create(nutritionistId, dto) {
        await this.validateOwnerships(nutritionistId, dto);
        const data = {
            nutritionistId,
            name: dto.name,
            description: dto.description,
            patientId: dto.patientId,
            mode: dto.mode ?? 'CLINICAL',
            status: dto.status ?? 'DRAFT',
            activeDietCreationId: dto.activeDietCreationId,
            activeRecipeCreationId: dto.activeRecipeCreationId,
            activeCartCreationId: dto.activeCartCreationId,
            activeDeliverableCreationId: dto.activeDeliverableCreationId,
            metadata: (dto.metadata ?? {}),
        };
        const project = await this.prisma.project.create({
            data,
            include: this.projectInclude,
        });
        await this.cacheService.invalidateNutritionistPrefix(nutritionistId, 'projects');
        return project;
    }
    async findAll(nutritionistId, search, status) {
        const where = { nutritionistId };
        if (status) {
            where.status = status;
        }
        if (search) {
            where.OR = [
                { name: { contains: search, mode: 'insensitive' } },
                { patient: { fullName: { contains: search, mode: 'insensitive' } } },
            ];
        }
        return this.prisma.project.findMany({
            where,
            include: this.projectInclude,
            orderBy: { updatedAt: 'desc' },
        });
    }
    async findOne(nutritionistId, id) {
        const project = await this.prisma.project.findUnique({
            where: { id },
            include: this.projectInclude,
        });
        if (!project) {
            throw new common_1.NotFoundException('Proyecto no encontrado');
        }
        if (project.nutritionistId !== nutritionistId) {
            throw new common_1.ForbiddenException('No tienes permiso para acceder a este proyecto');
        }
        return project;
    }
    async update(nutritionistId, id, dto) {
        await this.findOne(nutritionistId, id);
        await this.validateOwnerships(nutritionistId, dto);
        const data = {
            ...(dto.name !== undefined ? { name: dto.name } : {}),
            ...(dto.description !== undefined ? { description: dto.description } : {}),
            ...(dto.patientId !== undefined ? { patientId: dto.patientId } : {}),
            ...(dto.mode !== undefined ? { mode: dto.mode } : {}),
            ...(dto.status !== undefined ? { status: dto.status } : {}),
            ...(dto.activeDietCreationId !== undefined
                ? { activeDietCreationId: dto.activeDietCreationId }
                : {}),
            ...(dto.activeRecipeCreationId !== undefined
                ? { activeRecipeCreationId: dto.activeRecipeCreationId }
                : {}),
            ...(dto.activeCartCreationId !== undefined
                ? { activeCartCreationId: dto.activeCartCreationId }
                : {}),
            ...(dto.activeDeliverableCreationId !== undefined
                ? {
                    activeDeliverableCreationId: dto.activeDeliverableCreationId,
                }
                : {}),
            ...(dto.metadata !== undefined
                ? { metadata: dto.metadata }
                : {}),
        };
        const project = await this.prisma.project.update({
            where: { id },
            data,
            include: this.projectInclude,
        });
        await this.cacheService.invalidateNutritionistPrefix(nutritionistId, 'projects');
        return project;
    }
};
exports.ProjectsService = ProjectsService;
exports.ProjectsService = ProjectsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        cache_service_1.CacheService])
], ProjectsService);
//# sourceMappingURL=projects.service.js.map