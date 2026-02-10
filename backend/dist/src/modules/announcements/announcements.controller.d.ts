import { AnnouncementsService } from './announcements.service';
import { CreateAnnouncementDto } from './dto/create-announcement.dto';
export declare class AnnouncementsController {
    private readonly announcementsService;
    constructor(announcementsService: AnnouncementsService);
    create(req: any, createAnnouncementDto: CreateAnnouncementDto): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        isActive: boolean;
        link: string | null;
        message: string;
        type: string;
        title: string;
        targetRoles: string[];
    }>;
    findAll(): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        isActive: boolean;
        link: string | null;
        message: string;
        type: string;
        title: string;
        targetRoles: string[];
    }[]>;
}
