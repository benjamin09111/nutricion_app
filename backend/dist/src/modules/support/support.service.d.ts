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
        message: string | null;
        email: string;
        status: import(".prisma/client").$Enums.SupportRequestStatus;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        type: import(".prisma/client").$Enums.SupportRequestType;
    }>;
    findAll(): Promise<{
        message: string | null;
        email: string;
        status: import(".prisma/client").$Enums.SupportRequestStatus;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        type: import(".prisma/client").$Enums.SupportRequestType;
    }[]>;
    resolve(id: string): Promise<{
        message: string | null;
        email: string;
        status: import(".prisma/client").$Enums.SupportRequestStatus;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        type: import(".prisma/client").$Enums.SupportRequestType;
    }>;
    remove(id: string): Promise<{
        message: string | null;
        email: string;
        status: import(".prisma/client").$Enums.SupportRequestStatus;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        type: import(".prisma/client").$Enums.SupportRequestType;
    }>;
}
