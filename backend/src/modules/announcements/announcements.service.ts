
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateAnnouncementDto } from './dto/create-announcement.dto';

@Injectable()
export class AnnouncementsService {
    constructor(private prisma: PrismaService) { }

    async create(data: CreateAnnouncementDto) {
        return this.prisma.announcement.create({
            data: {
                title: data.title,
                message: data.message,
                type: data.type || 'info',
                link: data.link,
                targetRoles: data.targetRoles || ['ALL'],
            },
        });
    }

    async findAll() {
        return this.prisma.announcement.findMany({
            where: { isActive: true },
            orderBy: { createdAt: 'desc' },
        });
    }
}
