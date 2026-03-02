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
exports.MetricsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
const cache_service_1 = require("../../common/services/cache.service");
let MetricsService = class MetricsService {
    prisma;
    cacheService;
    constructor(prisma, cacheService) {
        this.prisma = prisma;
        this.cacheService = cacheService;
    }
    async findAll() {
        return this.prisma.metricDefinition.findMany({
            orderBy: { name: 'asc' },
        });
    }
    async findOrCreate(data, nutritionistId) {
        const key = data.key || data.name.trim().toLowerCase().replace(/\s+/g, '_');
        const existingMetric = await this.prisma.metricDefinition.findFirst({
            where: {
                OR: [
                    { key },
                    { name: { equals: data.name.trim(), mode: 'insensitive' } }
                ]
            }
        });
        if (existingMetric) {
            return existingMetric;
        }
        const metric = await this.prisma.metricDefinition.create({
            data: {
                ...data,
                key,
                nutritionistId
            },
        });
        await this.cacheService.invalidateGlobalPrefix('metrics');
        return metric;
    }
    async search(query) {
        return this.prisma.metricDefinition.findMany({
            where: {
                OR: [
                    { name: { contains: query, mode: 'insensitive' } },
                    { key: { contains: query, mode: 'insensitive' } },
                ],
            },
            orderBy: { name: 'asc' },
            take: 20,
        });
    }
    async remove(id, nutritionistId, role) {
        const metric = await this.prisma.metricDefinition.findUnique({ where: { id } });
        if (!metric) {
            throw new Error('La métrica que intentas eliminar no existe o ya fue borrada.');
        }
        const isAdmin = role && role.startsWith('ADMIN');
        if (!isAdmin && metric.nutritionistId && metric.nutritionistId !== nutritionistId) {
            throw new Error('No tienes permisos para eliminar esta métrica');
        }
        if (!isAdmin && !metric.nutritionistId) {
            throw new Error('Las métricas globales del sistema no pueden ser eliminadas');
        }
        const deleted = await this.prisma.metricDefinition.delete({
            where: { id },
        });
        await this.cacheService.invalidateGlobalPrefix('metrics');
        return deleted;
    }
};
exports.MetricsService = MetricsService;
exports.MetricsService = MetricsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        cache_service_1.CacheService])
], MetricsService);
//# sourceMappingURL=metrics.service.js.map