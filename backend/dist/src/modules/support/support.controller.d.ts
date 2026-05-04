import { SupportService } from './support.service';
import { CreateSupportRequestDto } from './dto/create-support-request.dto';
export declare class SupportController {
    private readonly supportService;
    constructor(supportService: SupportService);
    create(body: CreateSupportRequestDto): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        email: string;
        status: import(".prisma/client").$Enums.SupportRequestStatus;
        message: string | null;
        type: import(".prisma/client").$Enums.SupportRequestType;
    }>;
    createFeedback(req: any, body: import('./dto/create-feedback.dto').CreateFeedbackDto): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        email: string;
        status: import(".prisma/client").$Enums.SupportRequestStatus;
        message: string | null;
        type: import(".prisma/client").$Enums.SupportRequestType;
    }>;
    findAll(): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        email: string;
        status: import(".prisma/client").$Enums.SupportRequestStatus;
        message: string | null;
        type: import(".prisma/client").$Enums.SupportRequestType;
    }[]>;
    resolve(id: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        email: string;
        status: import(".prisma/client").$Enums.SupportRequestStatus;
        message: string | null;
        type: import(".prisma/client").$Enums.SupportRequestType;
    }>;
    remove(id: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        email: string;
        status: import(".prisma/client").$Enums.SupportRequestStatus;
        message: string | null;
        type: import(".prisma/client").$Enums.SupportRequestType;
    }>;
}
