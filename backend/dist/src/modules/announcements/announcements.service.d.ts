import { PrismaService } from '../../prisma/prisma.service';
import { CreateAnnouncementDto } from './dto/create-announcement.dto';
export declare class AnnouncementsService {
    private prisma;
    constructor(prisma: PrismaService);
    create(data: CreateAnnouncementDto): Promise<{
        message: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        type: string;
        isActive: boolean;
        title: string;
        link: string | null;
        targetRoles: string[];
    }>;
    findAll(): Promise<{
        message: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        type: string;
        isActive: boolean;
        title: string;
        link: string | null;
        targetRoles: string[];
    }[]>;
}
