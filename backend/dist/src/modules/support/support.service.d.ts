import { PrismaService } from '../../prisma/prisma.service';
import { MailService } from '../mail/mail.service';
export declare class SupportService {
    private prisma;
    private mailService;
    constructor(prisma: PrismaService, mailService: MailService);
    create(data: {
        email: string;
        message?: string;
        type: string;
        subject?: string;
    }): Promise<{
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
