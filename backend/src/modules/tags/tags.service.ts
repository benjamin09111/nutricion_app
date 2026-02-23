import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class TagsService {
    constructor(private readonly prisma: PrismaService) { }

    async findAll() {
        return this.prisma.tag.findMany({
            orderBy: { name: 'asc' },
        });
    }

    async findOrCreate(name: string) {
        const normalizedName = name.trim();
        if (!normalizedName) return null;

        return this.prisma.tag.upsert({
            where: { name: normalizedName },
            update: {},
            create: { name: normalizedName },
        });
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
        });
    }

    async remove(id: string) {
        return this.prisma.tag.delete({
            where: { id },
        });
    }
}
