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
        status: import(".prisma/client").$Enums.SupportRequestStatus;
        createdAt: Date;
        updatedAt: Date;
        type: import(".prisma/client").$Enums.SupportRequestType;
        message: string | null;
    }>;
    findAll(): Promise<{
        id: string;
        email: string;
        status: import(".prisma/client").$Enums.SupportRequestStatus;
        createdAt: Date;
        updatedAt: Date;
        type: import(".prisma/client").$Enums.SupportRequestType;
        message: string | null;
    }[]>;
    resolve(id: string): Promise<{
        id: string;
        email: string;
        status: import(".prisma/client").$Enums.SupportRequestStatus;
        createdAt: Date;
        updatedAt: Date;
        type: import(".prisma/client").$Enums.SupportRequestType;
        message: string | null;
    }>;
    remove(id: string): Promise<{
        id: string;
        email: string;
        status: import(".prisma/client").$Enums.SupportRequestStatus;
        createdAt: Date;
        updatedAt: Date;
        type: import(".prisma/client").$Enums.SupportRequestType;
        message: string | null;
    }>;
}
