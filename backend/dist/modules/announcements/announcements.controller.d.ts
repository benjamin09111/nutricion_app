import { AnnouncementsService } from './announcements.service';
import { CreateAnnouncementDto } from './dto/create-announcement.dto';
export declare class AnnouncementsController {
    private readonly announcementsService;
    constructor(announcementsService: AnnouncementsService);
    create(req: any, createAnnouncementDto: CreateAnnouncementDto): Promise<{
        id: string;
        message: string;
        createdAt: Date;
        updatedAt: Date;
        isActive: boolean;
        type: string;
        title: string;
        link: string | null;
        targetRoles: string[];
    }>;
    findAll(): Promise<{
        id: string;
        message: string;
        createdAt: Date;
        updatedAt: Date;
        isActive: boolean;
        type: string;
        title: string;
        link: string | null;
        targetRoles: string[];
    }[]>;
}
