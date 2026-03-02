import { PrismaService } from '../../prisma/prisma.service';
import { CreateAnnouncementDto } from './dto/create-announcement.dto';
export declare class AnnouncementsService {
    private prisma;
    constructor(prisma: PrismaService);
    create(data: CreateAnnouncementDto): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        type: string;
        isActive: boolean;
        title: string;
        link: string | null;
        message: string;
        targetRoles: string[];
    }>;
    findAll(): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        type: string;
        isActive: boolean;
        title: string;
        link: string | null;
        message: string;
        targetRoles: string[];
    }[]>;
}
