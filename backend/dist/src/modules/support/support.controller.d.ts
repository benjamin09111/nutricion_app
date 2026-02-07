import { SupportService } from './support.service';
import { CreateSupportRequestDto } from './dto/create-support-request.dto';
export declare class SupportController {
    private readonly supportService;
    constructor(supportService: SupportService);
    create(body: CreateSupportRequestDto): Promise<{
        id: string;
        email: string;
        message: string | null;
        type: import(".prisma/client").$Enums.SupportRequestType;
        status: import(".prisma/client").$Enums.SupportRequestStatus;
        createdAt: Date;
        updatedAt: Date;
    }>;
    findAll(): Promise<{
        id: string;
        email: string;
        message: string | null;
        type: import(".prisma/client").$Enums.SupportRequestType;
        status: import(".prisma/client").$Enums.SupportRequestStatus;
        createdAt: Date;
        updatedAt: Date;
    }[]>;
    resolve(id: string): Promise<{
        id: string;
        email: string;
        message: string | null;
        type: import(".prisma/client").$Enums.SupportRequestType;
        status: import(".prisma/client").$Enums.SupportRequestStatus;
        createdAt: Date;
        updatedAt: Date;
    }>;
}
