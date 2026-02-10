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
