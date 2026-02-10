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

    async findAll(params: {
        page?: number;
        limit?: number;
        status?: 'PENDING' | 'ACCEPTED' | 'APPROVED' | 'REJECTED' | 'ALL_ACCEPTED';
        search?: string;
    } = {}) {
        const { page = 1, limit = 10, status, search } = params;
        const skip = (page - 1) * limit;

        const where: any = {};

        // Status filter
        if (status) {
            if (status === 'ALL_ACCEPTED') {
                where.status = { in: ['ACCEPTED', 'APPROVED'] };
            } else {
                where.status = status;
            }
        }

        // Search filter
        if (search) {
            where.OR = [
                { fullName: { contains: search, mode: 'insensitive' } },
                { email: { contains: search, mode: 'insensitive' } },
            ];
        }

        const [data, total, pendingCount, acceptedCount, rejectedCount] = await Promise.all([
            this.prisma.registrationRequest.findMany({
                where,
                skip,
                take: Number(limit),
                orderBy: { createdAt: 'desc' },
            }),
            this.prisma.registrationRequest.count({ where }),
            this.prisma.registrationRequest.count({ where: { status: 'PENDING' } }),
            this.prisma.registrationRequest.count({ where: { status: { in: ['ACCEPTED', 'APPROVED'] } } }),
            this.prisma.registrationRequest.count({ where: { status: 'REJECTED' } }),
        ]);

        return {
            data,
            meta: {
                total,
                page: Number(page),
                limit: Number(limit),
                totalPages: Math.ceil(total / limit),
                counts: {
                    pending: pendingCount,
                    accepted: acceptedCount,
                    rejected: rejectedCount
                }
            }
        };
    }

    async delete(id: string) {
        return this.prisma.registrationRequest.delete({
            where: { id }
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
                // This method ALREADY generates a random password, creates the account and sends the welcome email with credentials
                await this.authService.createAccount(
                    request.email,
                    'NUTRITIONIST',
                    request.fullName,
                    adminNotes
                );

                // Update Request Status
                await this.prisma.registrationRequest.update({
                    where: { id },
                    data: { status, adminNotes }
                });

                return { success: true, message: 'Solicitud aceptada y credenciales enviadas automáticamente al correo.' };
            } catch (error: any) {
                console.error("Error confirming request:", error);
                throw new BadRequestException("Error al crear la cuenta: " + error.message);
            }
        }

        if (status === 'REJECTED') {
            await this.mailService.sendRejectionEmail(request.email, request.fullName, adminNotes);
        }

        // Standard update for other cases (Rejection or moving back to pending)
        return this.prisma.registrationRequest.update({
            where: { id },
            data: { status, adminNotes },
        });
    }
}
