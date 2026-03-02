import { PrismaService } from '../../prisma/prisma.service';
import { CreateRegistrationRequestDto } from './dto/create-registration-request.dto';
import { MailService } from '../mail/mail.service';
import { AuthService } from '../auth/auth.service';
export declare class RequestsService {
    private prisma;
    private mailService;
    private authService;
    constructor(prisma: PrismaService, mailService: MailService, authService: AuthService);
    create(createDto: CreateRegistrationRequestDto): Promise<{
        success: boolean;
        message: string;
    }>;
    findAll(params?: {
        page?: number;
        limit?: number;
        status?: 'PENDING' | 'ACCEPTED' | 'APPROVED' | 'REJECTED' | 'ALL_ACCEPTED';
        search?: string;
    }): Promise<{
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
    delete(id: string): Promise<{
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
    findOne(id: string): Promise<{
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
    } | null>;
    getPendingCount(): Promise<number>;
    updateStatus(id: string, status: 'PENDING' | 'ACCEPTED' | 'APPROVED' | 'REJECTED', adminNotes?: string): Promise<{
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
