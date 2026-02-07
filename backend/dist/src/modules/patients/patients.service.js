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
let PatientsService = class PatientsService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create(nutritionistId, createPatientDto) {
        return this.prisma.patient.create({
            data: {
                ...createPatientDto,
                nutritionistId,
            },
        });
    }
    async findAll(nutritionistId, page = 1, limit = 20, search) {
        const skip = (page - 1) * limit;
        const where = {
            nutritionistId,
        };
        if (search) {
            where.OR = [
                { fullName: { contains: search, mode: 'insensitive' } },
                { email: { contains: search, mode: 'insensitive' } },
            ];
        }
        const [total, data] = await Promise.all([
            this.prisma.patient.count({ where }),
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
                page,
                lastPage: Math.ceil(total / limit),
            },
        };
    }
    async findOne(nutritionistId, id) {
        const patient = await this.prisma.patient.findUnique({
            where: { id },
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
        return this.prisma.patient.update({
            where: { id },
            data: updatePatientDto,
        });
    }
    async remove(nutritionistId, id) {
        await this.findOne(nutritionistId, id);
        return this.prisma.patient.delete({
            where: { id },
        });
    }
};
exports.PatientsService = PatientsService;
exports.PatientsService = PatientsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], PatientsService);
//# sourceMappingURL=patients.service.js.map