import { AnnouncementsService } from './announcements.service';
import { CreateAnnouncementDto } from './dto/create-announcement.dto';
export declare class AnnouncementsController {
    private readonly announcementsService;
    constructor(announcementsService: AnnouncementsService);
    create(req: any, createAnnouncementDto: CreateAnnouncementDto): Promise<{
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
