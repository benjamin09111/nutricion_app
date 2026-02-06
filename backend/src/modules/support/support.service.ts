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

    async create(data: { email: string; message?: string; type: SupportRequestType }) {
        // 1. Save request to DB
        const request = await this.prisma.supportRequest.create({
            data: {
                email: data.email,
                message: data.message,
                type: data.type,
                status: 'PENDING'
            }
        });

        // 2. Optional: Notify Admins via Email (Future improvement)

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
