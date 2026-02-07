import { PrismaService } from '../../prisma/prisma.service';
import { CreateRegistrationRequestDto } from './dto/create-registration-request.dto';
import { MailService } from '../mail/mail.service';
export declare class RequestsService {
    private prisma;
    private mailService;
    constructor(prisma: PrismaService, mailService: MailService);
    create(createDto: CreateRegistrationRequestDto): Promise<{
        success: boolean;
        message: string;
    }>;
    findAll(): Promise<{
        email: string;
        message: string | null;
        id: string;
        status: import(".prisma/client").$Enums.RequestStatus;
        createdAt: Date;
        updatedAt: Date;
        fullName: string;
        professionalId: string | null;
        specialty: string | null;
        phone: string | null;
        adminNotes: string | null;
    }[]>;
    findOne(id: string): Promise<{
        email: string;
        message: string | null;
        id: string;
        status: import(".prisma/client").$Enums.RequestStatus;
        createdAt: Date;
        updatedAt: Date;
        fullName: string;
        professionalId: string | null;
        specialty: string | null;
        phone: string | null;
        adminNotes: string | null;
    } | null>;
    getPendingCount(): Promise<number>;
    updateStatus(id: string, status: 'PENDING' | 'ACCEPTED' | 'APPROVED' | 'REJECTED', adminNotes?: string): Promise<{
        email: string;
        message: string | null;
        id: string;
        status: import(".prisma/client").$Enums.RequestStatus;
        createdAt: Date;
        updatedAt: Date;
        fullName: string;
        professionalId: string | null;
        specialty: string | null;
        phone: string | null;
        adminNotes: string | null;
    } | {
        success: boolean;
        message: string;
    }>;
}
