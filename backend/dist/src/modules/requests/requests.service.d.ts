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
    findAll(): Promise<{
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
    findOne(id: string): Promise<{
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
    } | null>;
    getPendingCount(): Promise<number>;
    updateStatus(id: string, status: 'PENDING' | 'ACCEPTED' | 'APPROVED' | 'REJECTED', adminNotes?: string): Promise<{
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
