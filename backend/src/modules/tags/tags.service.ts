import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

import { CacheService } from '../../common/services/cache.service';

@Injectable()
export class TagsService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly cacheService: CacheService
    ) { }

    async findAll(limit?: number) {
        return this.prisma.tag.findMany({
            orderBy: { name: 'asc' },
            ...(limit ? { take: limit } : {}),
            select: {
                id: true,
                name: true,
                nutritionistId: true
            }
        });
    }

    async findOrCreate(name: string, nutritionistId?: string) {
        const normalizedName = name.trim();
        if (!normalizedName) return null;

        const existingTag = await this.prisma.tag.findFirst({
            where: {
                name: { equals: normalizedName, mode: 'insensitive' }
            }
        });

        if (existingTag) {
            return existingTag;
        }

        const tag = await this.prisma.tag.create({
            data: {
                name: normalizedName,
                nutritionistId: nutritionistId
            },
        });

        await this.cacheService.invalidateGlobalPrefix('tags');
        return tag;
    }

    async search(query: string) {
        return this.prisma.tag.findMany({
            where: {
                name: {
                    contains: query,
                    mode: 'insensitive',
                },
            },
            orderBy: { name: 'asc' },
            take: 20,
            select: {
                id: true,
                name: true,
                nutritionistId: true
            }
        });
    }

    async remove(id: string, nutritionistId: string, role?: string) {
        const tag = await this.prisma.tag.findUnique({ where: { id } });
        if (!tag) {
            throw new Error('La restricción que intentas eliminar no existe o ya fue borrada.');
        }


        const isAdmin = role && role.startsWith('ADMIN');

        // If tag is global (no nutritionistId), only an admin should delete it (future check)
        // For now, if the user created it, they can delete it.
        if (!isAdmin && tag.nutritionistId && tag.nutritionistId !== nutritionistId) {
            throw new Error('No tienes permisos para eliminar esta restricción');
        }

        if (!isAdmin && !tag.nutritionistId) {
            throw new Error('Las restricciones globales del sistema no pueden ser eliminadas');
        }

        const deleted = await this.prisma.tag.delete({
            where: { id },
        });

        await this.cacheService.invalidateGlobalPrefix('tags');
        return deleted;
    }
}
