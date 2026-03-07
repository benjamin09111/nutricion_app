import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class ResourcesService {
    constructor(private readonly prisma: PrismaService) { }

    async findAll(nutritionistId: string, isAdmin: boolean) {
        const resources = await this.prisma.resource.findMany({
            where: {
                OR: [
                    { nutritionistId },
                    { nutritionistId: null }, // Public/Default resources
                    { isPublic: true },
                ],
            },
            orderBy: { updatedAt: 'desc' },
        });

        return resources.map(resource => ({
            ...resource,
            isMine: resource.nutritionistId === nutritionistId
        }));
    }

    async findOne(id: string) {
        return this.prisma.resource.findUnique({
            where: { id },
        });
    }

    async create(nutritionistId: string | null, data: { title: string; content: string; category: string; tags?: string[]; images?: any; isPublic?: boolean; sources?: string }) {
        return this.prisma.resource.create({
            data: {
                ...data,
                nutritionistId,
            },
        });
    }

    async update(id: string, nutritionistId: string, isAdmin: boolean, data: { title?: string; content?: string; category?: string; tags?: string[]; images?: any; isPublic?: boolean; sources?: string }) {
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

    async getSections(nutritionistId: string) {
        return this.prisma.resourceSection.findMany({
            where: {
                OR: [
                    { nutritionistId },
                    { nutritionistId: null }, // System defaults
                ],
            },
            orderBy: { name: 'asc' },
        });
    }

    async createSection(nutritionistId: string | null, data: { name: string; icon?: string; color?: string; bg?: string }) {
        const slug = data.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');

        // Check if exists
        const existing = await this.prisma.resourceSection.findFirst({
            where: {
                OR: [
                    { slug },
                    { name: data.name }
                ]
            }
        });

        if (existing) {
            return existing; // Return existing if already there
        }

        return this.prisma.resourceSection.create({
            data: {
                ...data,
                slug,
                nutritionistId,
            },
        });
    }
}
