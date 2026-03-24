"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RequestsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
const mail_service_1 = require("../mail/mail.service");
const auth_service_1 = require("../auth/auth.service");
let RequestsService = class RequestsService {
    prisma;
    mailService;
    authService;
    constructor(prisma, mailService, authService) {
        this.prisma = prisma;
        this.mailService = mailService;
        this.authService = authService;
    }
    async create(createDto) {
        const existingUser = await this.prisma.account.findUnique({
            where: { email: createDto.email },
        });
        if (existingUser) {
            throw new common_1.BadRequestException('Este correo ya está registrado en el sistema.');
        }
        const existingRequest = await this.prisma.registrationRequest.findFirst({
            where: {
                email: createDto.email,
                status: 'PENDING'
            },
        });
        if (existingRequest) {
            throw new common_1.BadRequestException('Ya tienes una solicitud pendiente. Te contactaremos pronto.');
        }
        const request = await this.prisma.registrationRequest.create({
            data: createDto,
        });
        await this.mailService.sendAdminNotification(createDto);
        await this.mailService.sendRegistrationConfirmation(createDto.email, createDto.fullName);
        return {
            success: true,
            message: 'Solicitud enviada correctamente. Revisaremos tus datos y te contactaremos.',
        };
    }
    async findAll(params = {}) {
        const { page = 1, limit = 10, status, search } = params;
        const skip = (page - 1) * limit;
        const where = {};
        if (status) {
            if (status === 'ALL_ACCEPTED') {
                where.status = { in: ['ACCEPTED', 'APPROVED'] };
            }
            else {
                where.status = status;
            }
        }
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
    async delete(id) {
        return this.prisma.registrationRequest.delete({
            where: { id }
        });
    }
    async findOne(id) {
        return this.prisma.registrationRequest.findUnique({
            where: { id },
        });
    }
    async getPendingCount() {
        return this.prisma.registrationRequest.count({
            where: { status: 'PENDING' }
        });
    }
    async updateStatus(id, status, adminNotes) {
        const request = await this.prisma.registrationRequest.findUnique({ where: { id } });
        if (!request)
            throw new common_1.BadRequestException('Petición no encontrada');
        const isApproving = status === 'ACCEPTED' || status === 'APPROVED';
        const wasAlreadyApproved = request.status === 'ACCEPTED' || request.status === 'APPROVED';
        if (isApproving && !wasAlreadyApproved) {
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
            try {
                await this.authService.createAccount(request.email, 'NUTRITIONIST', request.fullName, adminNotes);
                await this.prisma.registrationRequest.update({
                    where: { id },
                    data: { status, adminNotes }
                });
                return { success: true, message: 'Solicitud aceptada y credenciales enviadas automáticamente al correo.' };
            }
            catch (error) {
                console.error("Error confirming request:", error);
                throw new common_1.BadRequestException("Error al crear la cuenta: " + error.message);
            }
        }
        if (status === 'REJECTED') {
            await this.mailService.sendRejectionEmail(request.email, request.fullName, adminNotes);
        }
        return this.prisma.registrationRequest.update({
            where: { id },
            data: { status, adminNotes },
        });
    }
};
exports.RequestsService = RequestsService;
exports.RequestsService = RequestsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        mail_service_1.MailService,
        auth_service_1.AuthService])
], RequestsService);
//# sourceMappingURL=requests.service.js.map