import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

import { CacheService } from '../../common/services/cache.service';

@Injectable()
export class CreationsService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly cacheService: CacheService
    ) { }

    async create(nutritionistId: string, data: any) {
        const { name, type, content, metadata, tags } = data;

        if (!nutritionistId) {
            throw new Error('No se pudo identificar tu perfil de nutricionista. Asegúrate de tener una cuenta de nutricionista activa.');
        }

        // Verificar si el nutricionista existe
        const nutritionist = await this.prisma.nutritionist.findUnique({
            where: { id: nutritionistId }
        });

        if (!nutritionist) {
            throw new Error('Perfil de nutricionista no encontrado. Intenta cerrar sesión y volver a entrar.');
        }

        // Validar que el nombre no esté vacío
        if (!name || name.trim() === '') {
            throw new Error('El nombre de la creación es obligatorio');
        }

        const creation = await this.prisma.creation.create({
            data: {
                name,
                type,
                content,
                metadata: metadata || {},
                tags: tags || [],
                nutritionist: { connect: { id: nutritionistId } }
            }
        });

        await this.cacheService.invalidateNutritionistPrefix(nutritionistId, 'creations');
        return creation;
    }

    async findAll(nutritionistId: string, type?: string) {
        return this.prisma.creation.findMany({
            where: {
                nutritionistId,
                ...(type ? { type } : {})
            },
            orderBy: { createdAt: 'desc' }
        });
    }

    async findOne(id: string, nutritionistId: string) {
        const creation = await this.prisma.creation.findFirst({
            where: { id, nutritionistId }
        });

        if (!creation) {
            throw new NotFoundException('La creación solicitada no existe o no tienes permiso para verla.');
        }

        return creation;
    }

    async delete(id: string, nutritionistId: string) {
        const result = await this.prisma.creation.deleteMany({
            where: { id, nutritionistId }
        });

        await this.cacheService.invalidateNutritionistPrefix(nutritionistId, 'creations');
        return result;
    }

    async getAvailableTags(nutritionistId: string) {
        // Obtenemos todos los tags únicos usando unnest de PostgreSQL
        const result: any[] = await this.prisma.$queryRaw`
            SELECT DISTINCT unnest(tags) as tag 
            FROM creations 
            WHERE nutritionist_id = ${nutritionistId}
            ORDER BY tag ASC
        `;
        return result.map(r => r.tag).filter(t => t);
    }
}
