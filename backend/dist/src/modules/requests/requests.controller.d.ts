import { RequestsService } from './requests.service';
import { CreateRegistrationRequestDto } from './dto/create-registration-request.dto';
export declare class RequestsController {
    private readonly requestsService;
    constructor(requestsService: RequestsService);
    create(createDto: CreateRegistrationRequestDto): Promise<{
        success: boolean;
        message: string;
    }>;
    findAll(req: any, page?: string, limit?: string, status?: 'PENDING' | 'ACCEPTED' | 'APPROVED' | 'REJECTED' | 'ALL_ACCEPTED', search?: string): Promise<{
        data: {
            message: string | null;
            fullName: string;
            email: string;
            phone: string | null;
            status: import(".prisma/client").$Enums.RequestStatus;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            professionalId: string | null;
            specialty: string | null;
            adminNotes: string | null;
        }[];
        meta: {
            total: number;
            page: number;
            limit: number;
            totalPages: number;
            counts: {
                pending: number;
                accepted: number;
                rejected: number;
            };
        };
    }>;
    remove(id: string, req: any): Promise<{
        message: string | null;
        fullName: string;
        email: string;
        phone: string | null;
        status: import(".prisma/client").$Enums.RequestStatus;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        professionalId: string | null;
        specialty: string | null;
        adminNotes: string | null;
    }>;
    getPendingCount(req: any): Promise<number>;
    updateStatus(id: string, body: {
        status: 'PENDING' | 'ACCEPTED' | 'APPROVED' | 'REJECTED';
        adminNotes?: string;
    }, req: any): Promise<{
        message: string | null;
        fullName: string;
        email: string;
        phone: string | null;
        status: import(".prisma/client").$Enums.RequestStatus;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        professionalId: string | null;
        specialty: string | null;
        adminNotes: string | null;
    } | {
        success: boolean;
        message: string;
    }>;
}
