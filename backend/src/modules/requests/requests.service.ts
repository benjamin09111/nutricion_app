import { Injectable, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateRegistrationRequestDto } from './dto/create-registration-request.dto';
import { MailService } from '../mail/mail.service';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class RequestsService {
    constructor(
        private prisma: PrismaService,
        private mailService: MailService,
    ) { }

    async create(createDto: CreateRegistrationRequestDto) {
        // 1. Check if email already exists in users or pending requests
        const existingUser = await this.prisma.account.findUnique({
            where: { email: createDto.email },
        });
        if (existingUser) {
            throw new BadRequestException('Este correo ya está registrado en el sistema.');
        }

        const existingRequest = await this.prisma.registrationRequest.findFirst({
            where: {
                email: createDto.email,
                status: 'PENDING'
            },
        });
        if (existingRequest) {
            throw new BadRequestException('Ya tienes una solicitud pendiente. Te contactaremos pronto.');
        }

        // 2. Save Request
        const request = await this.prisma.registrationRequest.create({
            data: createDto,
        });

        // 3. Send Notifications
        await this.mailService.sendAdminNotification(createDto);
        await this.mailService.sendRegistrationConfirmation(createDto.email, createDto.fullName);

        return {
            success: true,
            message: 'Solicitud enviada correctamente. Revisaremos tus datos y te contactaremos.',
        };
    }

    async findAll() {
        return this.prisma.registrationRequest.findMany({
            orderBy: { createdAt: 'desc' },
        });
    }

    async findOne(id: string) {
        return this.prisma.registrationRequest.findUnique({
            where: { id },
        });
    }

    async getPendingCount() {
        return this.prisma.registrationRequest.count({
            where: { status: 'PENDING' }
        });
    }

    async updateStatus(id: string, status: 'PENDING' | 'ACCEPTED' | 'APPROVED' | 'REJECTED', adminNotes?: string) {
        const request = await this.prisma.registrationRequest.findUnique({ where: { id } });
        if (!request) throw new BadRequestException('Petición no encontrada');

        // Logic for Account Creation (Triggered by ACCEPTED or APPROVED)
        const isApproving = status === 'ACCEPTED' || status === 'APPROVED';
        const wasAlreadyApproved = request.status === 'ACCEPTED' || request.status === 'APPROVED';

        if (isApproving && !wasAlreadyApproved) {
            // Check if user already exists
            const existingUser = await this.prisma.account.findUnique({
                where: { email: request.email },
            });

            if (existingUser) {
                await this.prisma.registrationRequest.update({
                    where: { id },
                    data: { status, adminNotes }
                });
                return { success: true, message: 'La cuenta ya existía. Solicitud marcada como aceptada.' };
            }

            const tempPassword = Math.random().toString(36).slice(-8) + 'Aa1!';
            const hashedPassword = await bcrypt.hash(tempPassword, 10);

            await this.prisma.$transaction(async (tx) => {
                // 1. Create Account
                const account = await tx.account.create({
                    data: {
                        email: request.email,
                        password: hashedPassword,
                        role: 'NUTRITIONIST',
                        status: 'ACTIVE',
                        plan: 'FREE',
                    }
                });

                // 2. Create Nutritionist Profile
                await tx.nutritionist.create({
                    data: {
                        accountId: account.id,
                        fullName: request.fullName,
                        professionalId: request.professionalId,
                        specialty: request.specialty,
                        phone: request.phone,
                    }
                });

                // 3. Update Request Status
                await tx.registrationRequest.update({
                    where: { id },
                    data: { status, adminNotes }
                });
            });

            // 4. Send Email with Creds
            await this.mailService.sendRegistrationApproved(request.email, request.fullName, tempPassword);

            return { success: true, message: 'Solicitud aceptada: Cuenta creada y credenciales enviadas.' };
        }

        // Standard update for other cases (Rejection or moving back to pending)
        return this.prisma.registrationRequest.update({
            where: { id },
            data: { status, adminNotes },
        });
    }
}
