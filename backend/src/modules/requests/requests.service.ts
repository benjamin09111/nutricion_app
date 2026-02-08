import { Injectable, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateRegistrationRequestDto } from './dto/create-registration-request.dto';
import { MailService } from '../mail/mail.service';
import { AuthService } from '../auth/auth.service';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class RequestsService {
    constructor(
        private prisma: PrismaService,
        private mailService: MailService,
        private authService: AuthService,
    ) { }

    async create(createDto: CreateRegistrationRequestDto) {
        // ... (lines 15-46 remain unchanged)
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

            // Utilize centralized AuthService to create account and profile
            try {
                await this.authService.createAccount(
                    request.email,
                    'NUTRITIONIST',
                    request.fullName
                );

                // Update Request Status
                await this.prisma.registrationRequest.update({
                    where: { id },
                    data: { status, adminNotes }
                });

                return { success: true, message: 'Solicitud aceptada: Cuenta creada y credenciales enviadas.' };
            } catch (error: any) {
                console.error("Error confirming request:", error);
                throw new BadRequestException("Error al crear la cuenta: " + error.message);
            }
        }

        // Standard update for other cases (Rejection or moving back to pending)
        return this.prisma.registrationRequest.update({
            where: { id },
            data: { status, adminNotes },
        });
    }
}
