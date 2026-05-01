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
        message: string | null;
        type: import(".prisma/client").$Enums.SupportRequestType;
    }>;
    createFeedback(req: any, body: import('./dto/create-feedback.dto').CreateFeedbackDto): Promise<{
        id: string;
        email: string;
        status: import(".prisma/client").$Enums.SupportRequestStatus;
        createdAt: Date;
        updatedAt: Date;
        message: string | null;
        type: import(".prisma/client").$Enums.SupportRequestType;
    }>;
    findAll(): Promise<{
        id: string;
        email: string;
        status: import(".prisma/client").$Enums.SupportRequestStatus;
        createdAt: Date;
        updatedAt: Date;
        message: string | null;
        type: import(".prisma/client").$Enums.SupportRequestType;
    }[]>;
    resolve(id: string): Promise<{
        id: string;
        email: string;
        status: import(".prisma/client").$Enums.SupportRequestStatus;
        createdAt: Date;
        updatedAt: Date;
        message: string | null;
        type: import(".prisma/client").$Enums.SupportRequestType;
    }>;
    remove(id: string): Promise<{
        id: string;
        email: string;
        status: import(".prisma/client").$Enums.SupportRequestStatus;
        createdAt: Date;
        updatedAt: Date;
        message: string | null;
        type: import(".prisma/client").$Enums.SupportRequestType;
    }>;
}
