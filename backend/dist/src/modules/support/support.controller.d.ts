import { SupportService } from './support.service';
import { CreateSupportRequestDto } from './dto/create-support-request.dto';
export declare class SupportController {
    private readonly supportService;
    constructor(supportService: SupportService);
    create(body: CreateSupportRequestDto): Promise<{
        message: string | null;
        email: string;
        status: import(".prisma/client").$Enums.SupportRequestStatus;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        type: import(".prisma/client").$Enums.SupportRequestType;
    }>;
    createFeedback(req: any, body: import('./dto/create-feedback.dto').CreateFeedbackDto): Promise<{
        message: string | null;
        email: string;
        status: import(".prisma/client").$Enums.SupportRequestStatus;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        type: import(".prisma/client").$Enums.SupportRequestType;
    }>;
    findAll(): Promise<{
        message: string | null;
        email: string;
        status: import(".prisma/client").$Enums.SupportRequestStatus;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        type: import(".prisma/client").$Enums.SupportRequestType;
    }[]>;
    resolve(id: string): Promise<{
        message: string | null;
        email: string;
        status: import(".prisma/client").$Enums.SupportRequestStatus;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        type: import(".prisma/client").$Enums.SupportRequestType;
    }>;
    remove(id: string): Promise<{
        message: string | null;
        email: string;
        status: import(".prisma/client").$Enums.SupportRequestStatus;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        type: import(".prisma/client").$Enums.SupportRequestType;
    }>;
}
