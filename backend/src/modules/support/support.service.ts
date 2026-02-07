import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { MailService } from '../mail/mail.service';
import { SupportRequestType, SupportRequestStatus } from '@prisma/client';

@Injectable()
export class SupportService {
    constructor(
        private prisma: PrismaService,
        private mailService: MailService
    ) { }

    async create(data: { email: string; message?: string; type: string; subject?: string }) {
        // Map frontend types to DB enum (temporary until DB migration)
        let dbType: SupportRequestType = 'OTHER';
        if (data.type === 'PASSWORD_RESET') dbType = 'PASSWORD_RESET';
        if (data.type === 'CONTACT') dbType = 'CONTACT';

        // 1. Save request to DB
        // We prepend the subject to the message for storage context
        const fullMessage = data.subject ? `[${data.subject}] ${data.message}` : data.message;

        const request = await this.prisma.supportRequest.create({
            data: {
                email: data.email,
                message: fullMessage,
                type: dbType,
                status: 'PENDING'
            }
        });

        // 2. Notify Admins via Email
        await this.mailService.sendFeedback({
            type: data.type, // Send the specific type (FEEDBACK, IDEA, etc)
            subject: data.subject || (data.message ? data.message.substring(0, 30) + '...' : 'Sin asunto'),
            message: data.message || 'Sin mensaje',
            fromEmail: data.email
        });

        return request;
    }

    async findAll() {
        return this.prisma.supportRequest.findMany({
            orderBy: { createdAt: 'desc' }
        });
    }

    async resolve(id: string) {
        return this.prisma.supportRequest.update({
            where: { id },
            data: { status: 'RESOLVED' }
        });
    }
}
