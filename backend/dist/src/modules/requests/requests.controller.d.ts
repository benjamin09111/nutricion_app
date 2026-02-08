import { RequestsService } from './requests.service';
import { CreateRegistrationRequestDto } from './dto/create-registration-request.dto';
export declare class RequestsController {
    private readonly requestsService;
    constructor(requestsService: RequestsService);
    create(createDto: CreateRegistrationRequestDto): Promise<{
        success: boolean;
        message: string;
    }>;
    findAll(req: any): Promise<{
        id: string;
        email: string;
        status: import(".prisma/client").$Enums.RequestStatus;
        createdAt: Date;
        updatedAt: Date;
        fullName: string;
        professionalId: string | null;
        specialty: string | null;
        phone: string | null;
        message: string | null;
        adminNotes: string | null;
    }[]>;
    getPendingCount(req: any): Promise<number>;
    updateStatus(id: string, body: {
        status: 'PENDING' | 'ACCEPTED' | 'APPROVED' | 'REJECTED';
        adminNotes?: string;
    }, req: any): Promise<{
        id: string;
        email: string;
        status: import(".prisma/client").$Enums.RequestStatus;
        createdAt: Date;
        updatedAt: Date;
        fullName: string;
        professionalId: string | null;
        specialty: string | null;
        phone: string | null;
        message: string | null;
        adminNotes: string | null;
    } | {
        success: boolean;
        message: string;
    }>;
}
