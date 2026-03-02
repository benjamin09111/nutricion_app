import { SupportService } from './support.service';
import { CreateSupportRequestDto } from './dto/create-support-request.dto';
export declare class SupportController {
    private readonly supportService;
    constructor(supportService: SupportService);
    create(body: CreateSupportRequestDto): Promise<{
        id: string;
        email: string;
        status: import(".prisma/client").$Enums.SupportRequestStatus;
        createdAt: Date;
        updatedAt: Date;
        type: import(".prisma/client").$Enums.SupportRequestType;
        message: string | null;
    }>;
    createFeedback(req: any, body: import('./dto/create-feedback.dto').CreateFeedbackDto): Promise<{
        id: string;
        email: string;
        status: import(".prisma/client").$Enums.SupportRequestStatus;
        createdAt: Date;
        updatedAt: Date;
        type: import(".prisma/client").$Enums.SupportRequestType;
        message: string | null;
    }>;
    findAll(): Promise<{
        id: string;
        email: string;
        status: import(".prisma/client").$Enums.SupportRequestStatus;
        createdAt: Date;
        updatedAt: Date;
        type: import(".prisma/client").$Enums.SupportRequestType;
        message: string | null;
    }[]>;
    resolve(id: string): Promise<{
        id: string;
        email: string;
        status: import(".prisma/client").$Enums.SupportRequestStatus;
        createdAt: Date;
        updatedAt: Date;
        type: import(".prisma/client").$Enums.SupportRequestType;
        message: string | null;
    }>;
    remove(id: string): Promise<{
        id: string;
        email: string;
        status: import(".prisma/client").$Enums.SupportRequestStatus;
        createdAt: Date;
        updatedAt: Date;
        type: import(".prisma/client").$Enums.SupportRequestType;
        message: string | null;
    }>;
}
