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
exports.PatientPortalsService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const jwt_1 = require("@nestjs/jwt");
const crypto_1 = require("crypto");
const prisma_service_1 = require("../../prisma/prisma.service");
const mail_service_1 = require("../mail/mail.service");
const ENTRY_SELECT = {
    id: true,
    kind: true,
    body: true,
    payload: true,
    replyToId: true,
    createdAt: true,
    updatedAt: true,
    replyTo: {
        select: {
            id: true,
            kind: true,
            body: true,
            payload: true,
            replyToId: true,
            createdAt: true,
            updatedAt: true,
        },
    },
    replies: {
        orderBy: {
            createdAt: 'asc',
        },
        select: {
            id: true,
            kind: true,
            body: true,
            payload: true,
            replyToId: true,
            createdAt: true,
            updatedAt: true,
        },
    },
};
let PatientPortalsService = class PatientPortalsService {
    prisma;
    jwtService;
    configService;
    mailService;
    constructor(prisma, jwtService, configService, mailService) {
        this.prisma = prisma;
        this.jwtService = jwtService;
        this.configService = configService;
        this.mailService = mailService;
    }
    async createInvitation(nutritionistId, patientId, dto) {
        const patient = await this.prisma.patient.findFirst({
            where: { id: patientId, nutritionistId },
            select: {
                id: true,
                fullName: true,
                email: true,
                nutritionist: {
                    select: {
                        id: true,
                        fullName: true,
                    },
                },
            },
        });
        if (!patient) {
            throw new common_1.NotFoundException('No encontramos ese paciente');
        }
        const expiresInDays = dto.expiresInDays && dto.expiresInDays > 0 ? dto.expiresInDays : 30;
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + expiresInDays);
        const token = (0, crypto_1.randomBytes)(32).toString('hex');
        const tokenHash = this.hashToken(token);
        const accessCode = this.formatAccessCodeForDisplay(this.getPortalAccessCode(patientId, nutritionistId));
        const invitation = await this.prisma.$transaction(async (tx) => {
            await tx.patientPortalInvitation.updateMany({
                where: {
                    patientId,
                    nutritionistId,
                    status: { in: ['ACTIVE', 'BLOCKED'] },
                },
                data: {
                    status: 'REVOKED',
                    revokedAt: new Date(),
                    blockedAt: null,
                },
            });
            return tx.patientPortalInvitation.create({
                data: {
                    patientId,
                    nutritionistId,
                    email: dto.email?.trim() || patient.email || null,
                    tokenHash,
                    expiresAt,
                    status: 'ACTIVE',
                    lastSentAt: new Date(),
                    resourceIds: Array.isArray(dto.resourceIds) ? dto.resourceIds : [],
                    deliverableCreationIds: Array.isArray(dto.deliverableCreationIds)
                        ? dto.deliverableCreationIds
                        : [],
                },
                select: {
                    id: true,
                    email: true,
                    expiresAt: true,
                    createdAt: true,
                    status: true,
                },
            });
        });
        const shareUrl = this.buildPortalUrl(token);
        const recipientEmail = dto.email?.trim() || patient.email || '';
        if (recipientEmail) {
            await this.mailService.sendPatientPortalInvitationEmail({
                email: recipientEmail,
                patientName: patient.fullName,
                nutritionistName: patient.nutritionist.fullName,
                shareUrl,
                expiresAt,
                accessCode,
            });
        }
        return {
            invitation,
            shareUrl,
            expiresAt,
            accessCode,
        };
    }
    async previewInvitation(token) {
        const invitation = await this.findInvitationByToken(token);
        return {
            patientName: invitation.patient.fullName,
            patientEmail: invitation.email || invitation.patient.email || null,
            nutritionistName: invitation.nutritionist.fullName,
            expiresAt: invitation.expiresAt,
        };
    }
    async verifyInvitation(token, email, accessCode) {
        const normalizedEmail = this.normalizeEmail(email);
        if (!normalizedEmail) {
            throw new common_1.BadRequestException('Debes ingresar un correo');
        }
        const normalizedCode = this.normalizeAccessCode(accessCode);
        if (!normalizedCode) {
            throw new common_1.BadRequestException('Debes ingresar tu código de acceso');
        }
        const invitation = await this.findInvitationByToken(token);
        const invitationEmail = invitation.email
            ? this.normalizeEmail(invitation.email)
            : null;
        const expectedCode = this.getPortalAccessCode(invitation.patientId, invitation.nutritionistId);
        if (invitationEmail && invitationEmail !== normalizedEmail) {
            throw new common_1.ForbiddenException('Ese correo no coincide con la invitación');
        }
        if (normalizedCode !== expectedCode) {
            throw new common_1.ForbiddenException('El código de acceso es incorrecto');
        }
        if (invitation.status !== 'ACTIVE' ||
            invitation.revokedAt ||
            invitation.blockedAt ||
            invitation.expiresAt.getTime() < Date.now()) {
            throw new common_1.ForbiddenException('La invitación expiró o ya no está activa');
        }
        if (!invitation.email) {
            await this.prisma.patientPortalInvitation.update({
                where: { id: invitation.id },
                data: {
                    email: normalizedEmail,
                },
            });
        }
        await this.prisma.patientPortalInvitation.update({
            where: { id: invitation.id },
            data: {
                verifiedAt: new Date(),
            },
        });
        const accessToken = await this.jwtService.signAsync({
            kind: 'patient-portal',
            patientId: invitation.patientId,
            nutritionistId: invitation.nutritionistId,
            invitationId: invitation.id,
        }, {
            secret: this.configService.get('PORTAL_JWT_SECRET') ||
                this.configService.get('JWT_SECRET') ||
                'secret',
            expiresIn: '30d',
        });
        const overview = await this.buildOverview(invitation.nutritionistId, invitation.patientId);
        return {
            accessToken,
            ...overview,
        };
    }
    async getPortalSessionOverview(session) {
        return this.buildOverview(session.nutritionistId, session.patientId);
    }
    async getPortalOverview(nutritionistId, patientId) {
        return this.buildOverview(nutritionistId, patientId);
    }
    async setAccessStatus(nutritionistId, patientId, status) {
        const invitation = await this.prisma.patientPortalInvitation.findFirst({
            where: {
                patientId,
                nutritionistId,
            },
            orderBy: { createdAt: 'desc' },
        });
        if (!invitation) {
            throw new common_1.NotFoundException('No encontramos un acceso para este paciente');
        }
        const updated = await this.prisma.patientPortalInvitation.update({
            where: { id: invitation.id },
            data: {
                status,
                blockedAt: status === 'BLOCKED' ? new Date() : null,
                revokedAt: status === 'ACTIVE' ? null : invitation.revokedAt,
            },
            select: {
                id: true,
                status: true,
                blockedAt: true,
                revokedAt: true,
                updatedAt: true,
            },
        });
        return {
            invitation: updated,
            overview: await this.buildOverview(nutritionistId, patientId),
        };
    }
    async createQuestion(session, dto) {
        const body = dto.message.trim();
        if (!body) {
            throw new common_1.BadRequestException('Escribe tu pregunta o consulta');
        }
        const entry = await this.prisma.patientPortalEntry.create({
            data: {
                patientId: session.patientId,
                nutritionistId: session.nutritionistId,
                invitationId: session.invitationId,
                kind: 'QUESTION',
                body,
                payload: {
                    source: 'patient',
                },
            },
            select: ENTRY_SELECT,
        });
        return {
            entry,
            overview: await this.buildOverview(session.nutritionistId, session.patientId),
        };
    }
    async createTrackingEntry(session, dto) {
        const sections = this.buildTrackingSections(dto);
        if (!sections) {
            throw new common_1.BadRequestException('Agrega al menos una sección para guardar tu seguimiento');
        }
        const summary = this.buildTrackingSummary(sections, dto.entryDate);
        const entryDate = this.normalizeDiaryDate(dto.entryDate);
        const entry = await this.prisma.patientPortalEntry.create({
            data: {
                patientId: session.patientId,
                nutritionistId: session.nutritionistId,
                invitationId: session.invitationId,
                kind: 'TRACKING',
                body: summary,
                payload: {
                    source: 'patient',
                    sections,
                    entryDate,
                },
            },
            select: ENTRY_SELECT,
        });
        return {
            entry,
            overview: await this.buildOverview(session.nutritionistId, session.patientId),
        };
    }
    async createReply(nutritionistId, patientId, dto) {
        const question = await this.prisma.patientPortalEntry.findFirst({
            where: {
                id: dto.questionId,
                patientId,
                nutritionistId,
                kind: 'QUESTION',
            },
            select: ENTRY_SELECT,
        });
        if (!question) {
            throw new common_1.NotFoundException('No encontramos esa pregunta');
        }
        const body = dto.message.trim();
        if (!body) {
            throw new common_1.BadRequestException('Escribe un mensaje de respuesta');
        }
        const entry = await this.prisma.patientPortalEntry.create({
            data: {
                patientId,
                nutritionistId,
                kind: 'REPLY',
                body,
                replyToId: question.id,
                payload: {
                    source: 'nutritionist',
                },
            },
            select: ENTRY_SELECT,
        });
        return {
            entry,
            overview: await this.buildOverview(nutritionistId, patientId),
        };
    }
    async createNotification(nutritionistId, patientId, dto) {
        const patient = await this.prisma.patient.findFirst({
            where: { id: patientId, nutritionistId },
            select: {
                id: true,
                fullName: true,
                email: true,
                nutritionist: {
                    select: {
                        fullName: true,
                    },
                },
            },
        });
        if (!patient) {
            throw new common_1.NotFoundException('No encontramos ese paciente');
        }
        const title = dto.title?.trim() || 'Notificación del nutricionista';
        const message = dto.message.trim();
        if (!message) {
            throw new common_1.BadRequestException('Escribe un mensaje para la notificación');
        }
        const notificationType = message.length > 220 ? 'ALERT' : 'INFO';
        const entry = await this.prisma.patientPortalEntry.create({
            data: {
                patientId,
                nutritionistId,
                kind: 'NOTIFICATION',
                body: message,
                payload: {
                    source: 'nutritionist',
                    notificationTitle: title,
                    notificationType,
                },
            },
            select: ENTRY_SELECT,
        });
        const invitation = await this.prisma.patientPortalInvitation.findFirst({
            where: {
                patientId,
                nutritionistId,
                status: 'ACTIVE',
                revokedAt: null,
                blockedAt: null,
            },
            orderBy: { createdAt: 'desc' },
            select: {
                email: true,
            },
        });
        const recipientEmail = invitation?.email || patient.email || null;
        if (dto.sendEmail !== false && recipientEmail) {
            await this.mailService.sendPatientPortalNotificationEmail({
                email: recipientEmail,
                patientName: patient.fullName,
                nutritionistName: patient.nutritionist.fullName,
                title,
                message,
            });
        }
        return {
            entry,
            overview: await this.buildOverview(nutritionistId, patientId),
        };
    }
    async buildOverview(nutritionistId, patientId) {
        const [patient, invitations, entries] = await Promise.all([
            this.prisma.patient.findFirst({
                where: { id: patientId, nutritionistId },
                select: {
                    id: true,
                    fullName: true,
                    email: true,
                    phone: true,
                    documentId: true,
                    status: true,
                    weight: true,
                    height: true,
                    createdAt: true,
                    nutritionist: {
                        select: {
                            id: true,
                            fullName: true,
                            avatarUrl: true,
                        },
                    },
                    projects: {
                        orderBy: { updatedAt: 'desc' },
                        select: {
                            id: true,
                            name: true,
                            description: true,
                            mode: true,
                            status: true,
                            updatedAt: true,
                            activeDietCreation: {
                                select: {
                                    id: true,
                                    name: true,
                                    type: true,
                                },
                            },
                            activeRecipeCreation: {
                                select: {
                                    id: true,
                                    name: true,
                                    type: true,
                                },
                            },
                            activeDeliverableCreation: {
                                select: {
                                    id: true,
                                    name: true,
                                    type: true,
                                },
                            },
                        },
                    },
                },
            }),
            this.prisma.patientPortalInvitation.findMany({
                where: {
                    patientId,
                    nutritionistId,
                },
                orderBy: {
                    createdAt: 'desc',
                },
                take: 2,
                select: {
                    id: true,
                    email: true,
                    expiresAt: true,
                    status: true,
                    lastSentAt: true,
                    verifiedAt: true,
                    revokedAt: true,
                    blockedAt: true,
                    createdAt: true,
                    resourceIds: true,
                    deliverableCreationIds: true,
                },
            }),
            this.prisma.patientPortalEntry.findMany({
                where: {
                    patientId,
                    nutritionistId,
                },
                orderBy: {
                    createdAt: 'desc',
                },
                select: ENTRY_SELECT,
            }),
        ]);
        if (!patient) {
            throw new common_1.NotFoundException('No encontramos ese paciente');
        }
        const activeInvitation = invitations.find((invitation) => invitation.status === 'ACTIVE' &&
            !invitation.revokedAt &&
            !invitation.blockedAt &&
            invitation.expiresAt.getTime() >= Date.now()) || null;
        const latestInvitation = invitations[0] || null;
        const sharingInvitation = activeInvitation || latestInvitation;
        const [sharedResources, sharedDeliverables] = await Promise.all([
            sharingInvitation?.resourceIds?.length
                ? this.prisma.resource.findMany({
                    where: {
                        id: { in: sharingInvitation.resourceIds },
                        OR: [
                            { nutritionistId },
                            { isPublic: true },
                            { nutritionistId: null },
                        ],
                    },
                    orderBy: { updatedAt: 'desc' },
                    select: {
                        id: true,
                        title: true,
                        content: true,
                        category: true,
                        tags: true,
                        isPublic: true,
                        format: true,
                        fileUrl: true,
                        createdAt: true,
                        updatedAt: true,
                    },
                })
                : Promise.resolve([]),
            sharingInvitation?.deliverableCreationIds?.length
                ? this.prisma.creation.findMany({
                    where: {
                        id: { in: sharingInvitation.deliverableCreationIds },
                        nutritionistId,
                        type: { in: ['DELIVERABLE', 'FAST_DELIVERABLE'] },
                    },
                    orderBy: { updatedAt: 'desc' },
                    select: {
                        id: true,
                        name: true,
                        type: true,
                        format: true,
                        content: true,
                        metadata: true,
                        tags: true,
                        createdAt: true,
                        updatedAt: true,
                    },
                })
                : Promise.resolve([]),
        ]);
        const normalizedEntries = entries.map((entry) => this.normalizeEntry(entry));
        const questions = normalizedEntries.filter((entry) => entry.kind === 'QUESTION');
        const tracking = normalizedEntries.filter((entry) => entry.kind === 'TRACKING');
        const replies = normalizedEntries.filter((entry) => entry.kind === 'REPLY');
        const summary = this.buildSummary(normalizedEntries);
        return {
            patient,
            portal: {
                activeInvitation: activeInvitation
                    ? this.formatInvitationSummary(activeInvitation, patientId, nutritionistId)
                    : null,
                latestInvitation: latestInvitation
                    ? this.formatInvitationSummary(latestInvitation, patientId, nutritionistId)
                    : null,
            },
            summary,
            entries: normalizedEntries,
            questions,
            tracking,
            replies,
            notifications: normalizedEntries.filter((entry) => entry.kind === 'NOTIFICATION'),
            sharedResources,
            sharedDeliverables,
        };
    }
    buildSummary(entries) {
        const questionEntries = entries.filter((entry) => entry.kind === 'QUESTION');
        const trackingEntries = entries.filter((entry) => entry.kind === 'TRACKING');
        const replyEntries = entries.filter((entry) => entry.kind === 'REPLY');
        const latestEntry = entries[0] || null;
        const latestEntryAt = latestEntry?.createdAt || null;
        const pendingQuestions = questionEntries.filter((entry) => (entry.replies?.length || 0) === 0).length;
        const notificationsCount = entries.filter((entry) => entry.kind === 'NOTIFICATION').length;
        const sectionCounts = trackingEntries.reduce((acc, entry) => {
            const sections = entry.payload?.sections || {};
            if (sections.alimentacion)
                acc.alimentacion += 1;
            if (sections.suplementos)
                acc.suplementos += 1;
            if (sections.actividadFisica)
                acc.actividadFisica += 1;
            return acc;
        }, {
            alimentacion: 0,
            suplementos: 0,
            actividadFisica: 0,
        });
        let daysSinceLastEntry = 0;
        const alerts = [];
        if (!latestEntryAt) {
            alerts.push('Todavía no hay registros en el portal.');
        }
        else {
            const lastEntry = entries[0];
            daysSinceLastEntry = Math.floor((Date.now() - new Date(lastEntry.createdAt).getTime()) /
                (1000 * 60 * 60 * 24));
            if (daysSinceLastEntry > 3) {
                alerts.push(`Hace ${daysSinceLastEntry} días que no se actualiza el seguimiento.`);
            }
        }
        if (pendingQuestions > 0) {
            alerts.push(`${pendingQuestions} consulta${pendingQuestions === 1 ? '' : 's'} sin responder.`);
        }
        if (notificationsCount > 0) {
            alerts.push(`${notificationsCount} notificación${notificationsCount === 1 ? '' : 'es'} del nutri.`);
        }
        if (trackingEntries.length > 0 && sectionCounts.actividadFisica === 0) {
            alerts.push('Todavía no hay actividad física registrada.');
        }
        return {
            totalEntries: entries.length,
            questionsCount: questionEntries.length,
            trackingCount: trackingEntries.length,
            repliesCount: replyEntries.length,
            pendingQuestions,
            notificationsCount,
            latestEntryAt,
            daysSinceLastEntry,
            sectionCounts,
            alerts,
        };
    }
    buildTrackingSections(dto) {
        const alimentacion = dto.alimentacion?.trim();
        const suplementos = dto.suplementos?.trim();
        const actividadFisica = dto.actividadFisica?.trim();
        if (!alimentacion && !suplementos && !actividadFisica) {
            return null;
        }
        return {
            ...(alimentacion ? { alimentacion } : {}),
            ...(suplementos ? { suplementos } : {}),
            ...(actividadFisica ? { actividadFisica } : {}),
        };
    }
    buildTrackingSummary(sections, entryDate) {
        const dateLabel = this.normalizeDiaryDate(entryDate);
        const pieces = [
            dateLabel ? `Día ${dateLabel}` : null,
            sections.alimentacion ? `Alimentación: ${sections.alimentacion}` : null,
            sections.suplementos ? `Suplementos: ${sections.suplementos}` : null,
            sections.actividadFisica
                ? `Actividad física: ${sections.actividadFisica}`
                : null,
        ].filter(Boolean);
        return pieces.join(' Â· ');
    }
    normalizeDiaryDate(value) {
        if (!value)
            return null;
        const normalized = value.trim();
        if (!normalized)
            return null;
        const parsed = new Date(`${normalized}T12:00:00`);
        if (Number.isNaN(parsed.getTime())) {
            return normalized;
        }
        return parsed.toLocaleDateString('es-CL', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
        });
    }
    normalizeEntry(entry) {
        return {
            ...entry,
            kind: entry.kind,
            payload: (entry.payload || {}),
            replyTo: entry.replyTo
                ? {
                    ...entry.replyTo,
                    kind: entry.replyTo.kind,
                    payload: (entry.replyTo.payload || {}),
                }
                : null,
            replies: (entry.replies || []).map((reply) => ({
                ...reply,
                kind: reply.kind,
                payload: (reply.payload || {}),
            })),
        };
    }
    formatInvitationSummary(invitation, patientId, nutritionistId) {
        return {
            ...invitation,
            blockedAt: invitation.blockedAt || null,
            resourceIds: invitation.resourceIds || [],
            deliverableCreationIds: invitation.deliverableCreationIds || [],
            accessCode: this.formatAccessCodeForDisplay(this.getPortalAccessCode(patientId, nutritionistId)),
        };
    }
    async findInvitationByToken(token) {
        const tokenHash = this.hashToken(token);
        const invitation = await this.prisma.patientPortalInvitation.findUnique({
            where: { tokenHash },
            include: {
                patient: {
                    select: {
                        id: true,
                        fullName: true,
                        email: true,
                    },
                },
                nutritionist: {
                    select: {
                        id: true,
                        fullName: true,
                    },
                },
            },
        });
        if (!invitation) {
            throw new common_1.NotFoundException('La invitación no existe');
        }
        return invitation;
    }
    getPortalAccessCode(patientId, nutritionistId) {
        const secret = this.configService.get('PORTAL_ACCESS_CODE_SECRET') ||
            this.configService.get('PORTAL_JWT_SECRET') ||
            this.configService.get('JWT_SECRET') ||
            'secret';
        const digest = (0, crypto_1.createHash)('sha256')
            .update(`${secret}:${nutritionistId}:${patientId}:patient-portal-code`)
            .digest();
        const code = digest.readUInt32BE(0) % 1000000;
        return code.toString().padStart(6, '0');
    }
    formatAccessCodeForDisplay(code) {
        const digits = this.normalizeAccessCode(code).padStart(6, '0');
        return `${digits.slice(0, 3)}-${digits.slice(3, 6)}`;
    }
    buildPortalUrl(token) {
        const baseUrl = this.configService.get('PORTAL_BASE_URL') ||
            this.configService.get('FRONTEND_URL') ||
            this.configService.get('APP_URL') ||
            'http://localhost:3000';
        return `${baseUrl.replace(/\/$/, '')}/portal/${token}`;
    }
    hashToken(token) {
        return (0, crypto_1.createHash)('sha256').update(token).digest('hex');
    }
    normalizeEmail(email) {
        return email.trim().toLowerCase();
    }
    normalizeAccessCode(code) {
        return code.replace(/\D/g, '').slice(0, 6);
    }
};
exports.PatientPortalsService = PatientPortalsService;
exports.PatientPortalsService = PatientPortalsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        jwt_1.JwtService,
        config_1.ConfigService,
        mail_service_1.MailService])
], PatientPortalsService);
//# sourceMappingURL=patient-portals.service.js.map