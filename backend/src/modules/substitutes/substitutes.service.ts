import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class SubstitutesService {
    constructor(private readonly prisma: PrismaService) { }

    async findByNutritionist(nutritionistId: string) {
        if (!nutritionistId) {
            throw new Error('Nutritionist ID is required');
        }

        const nutritionist = await this.prisma.nutritionist.findUnique({
            where: { id: nutritionistId },
        });

        if (!nutritionist) {
            throw new NotFoundException('Nutritionist not found');
        }

        return this.prisma.substitute.findFirst({
            where: { nutritionistId },
        });
    }

    async upsert(nutritionistId: string, content: any) {
        if (!nutritionistId) {
            throw new Error('Nutritionist ID is required');
        }

        const nutritionist = await this.prisma.nutritionist.findUnique({
            where: { id: nutritionistId },
        });

        if (!nutritionist) {
            throw new NotFoundException('Nutritionist not found');
        }

        const existing = await this.prisma.substitute.findFirst({
            where: { nutritionistId },
        });

        if (existing) {
            return this.prisma.substitute.update({
                where: { id: existing.id },
                data: { content },
            });
        }

        return this.prisma.substitute.create({
            data: {
                nutritionistId,
                content,
            },
        });
    }
}
