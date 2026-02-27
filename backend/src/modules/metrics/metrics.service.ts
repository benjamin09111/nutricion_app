import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CacheService } from '../../common/services/cache.service';

@Injectable()
export class MetricsService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly cacheService: CacheService
    ) { }

    async findAll() {
        return this.prisma.metricDefinition.findMany({
            orderBy: { name: 'asc' },
        });
    }

    async findOrCreate(data: { name: string; unit: string; key: string; icon?: string; color?: string }, nutritionistId?: string) {
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

    async search(query: string) {
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

    async remove(id: string, nutritionistId: string, role?: string) {
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
}
