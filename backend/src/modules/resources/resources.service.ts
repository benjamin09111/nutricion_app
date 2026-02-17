import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class ResourcesService {
    constructor(private readonly prisma: PrismaService) { }

    async findAll(nutritionistId: string, isAdmin: boolean) {
        return this.prisma.resource.findMany({
            where: {
                OR: [
                    { nutritionistId },
                    { nutritionistId: null }, // Public/Default resources
                    { isPublic: true },
                ],
            },
            orderBy: { updatedAt: 'desc' },
        });
    }

    async findOne(id: string) {
        return this.prisma.resource.findUnique({
            where: { id },
        });
    }

    async create(nutritionistId: string | null, data: { title: string; content: string; category: string; tags?: string[]; images?: any; isPublic?: boolean }) {
        return this.prisma.resource.create({
            data: {
                ...data,
                nutritionistId,
            },
        });
    }

    async update(id: string, nutritionistId: string, isAdmin: boolean, data: { title?: string; content?: string; category?: string; tags?: string[]; images?: any; isPublic?: boolean }) {
        // Check ownership (admins can edit anything, but usually they edit global ones)
        const resource = await this.prisma.resource.findUnique({ where: { id } });
        if (!resource) throw new Error('Resource not found');

        if (!isAdmin && resource.nutritionistId !== nutritionistId) {
            throw new Error('Unauthorized');
        }

        return this.prisma.resource.update({
            where: { id },
            data,
        });
    }

    async remove(id: string, nutritionistId: string, isAdmin: boolean) {
        const resource = await this.prisma.resource.findUnique({ where: { id } });
        if (!resource) throw new Error('Resource not found');

        if (!isAdmin && resource.nutritionistId !== nutritionistId) {
            throw new Error('Unauthorized');
        }

        return this.prisma.resource.delete({
            where: { id },
        });
    }
}
