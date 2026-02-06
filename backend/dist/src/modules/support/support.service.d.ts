import { PrismaService } from '../../prisma/prisma.service';
import { MailService } from '../mail/mail.service';
import { SupportRequestType } from '@prisma/client';
export declare class SupportService {
    private prisma;
    private mailService;
    constructor(prisma: PrismaService, mailService: MailService);
    create(data: {
        email: string;
        message?: string;
        type: SupportRequestType;
    }): Promise<{
        id: string;
        email: string;
        status: import(".prisma/client").$Enums.SupportRequestStatus;
        createdAt: Date;
        updatedAt: Date;
        message: string | null;
        type: import(".prisma/client").$Enums.SupportRequestType;
    }>;
    findAll(): Promise<{
        id: string;
        email: string;
        status: import(".prisma/client").$Enums.SupportRequestStatus;
        createdAt: Date;
        updatedAt: Date;
        message: string | null;
        type: import(".prisma/client").$Enums.SupportRequestType;
    }[]>;
    resolve(id: string): Promise<{
        id: string;
        email: string;
        status: import(".prisma/client").$Enums.SupportRequestStatus;
        createdAt: Date;
        updatedAt: Date;
        message: string | null;
        type: import(".prisma/client").$Enums.SupportRequestType;
    }>;
}
