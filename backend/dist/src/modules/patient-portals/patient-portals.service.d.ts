import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../prisma/prisma.service';
import { MailService } from '../mail/mail.service';
import { CreatePatientPortalInvitationDto } from './dto/create-patient-portal-invitation.dto';
import { CreatePatientPortalEntryDto } from './dto/create-patient-portal-entry.dto';
import { CreatePatientPortalQuestionDto } from './dto/create-patient-portal-question.dto';
import { CreatePatientPortalReplyDto } from './dto/create-patient-portal-reply.dto';
import { CreatePatientPortalNotificationDto } from './dto/create-patient-portal-notification.dto';
type PortalSessionPayload = {
    kind: 'patient-portal';
    patientId: string;
    nutritionistId: string;
    invitationId: string;
};
type PortalEntryKind = 'QUESTION' | 'TRACKING' | 'REPLY' | 'NOTIFICATION';
type NormalizedPortalEntry = {
    id: string;
    kind: PortalEntryKind;
    body?: string | null;
    payload: PortalEntryPayload;
    replyToId?: string | null;
    createdAt: Date;
    updatedAt: Date;
    replyTo: {
        id: string;
        kind: PortalEntryKind;
        body?: string | null;
        payload: PortalEntryPayload;
        replyToId?: string | null;
        createdAt: Date;
        updatedAt: Date;
    } | null;
    replies: Array<{
        id: string;
        kind: PortalEntryKind;
        body?: string | null;
        payload: PortalEntryPayload;
        replyToId?: string | null;
        createdAt: Date;
        updatedAt: Date;
    }>;
};
type PortalEntryPayload = {
    entryDate?: string;
    sections?: TrackingSections;
    source?: 'patient' | 'nutritionist';
    notificationTitle?: string;
    notificationType?: 'INFO' | 'REMINDER' | 'ALERT';
};
type InvitationSummary = {
    id: string;
    email: string | null;
    expiresAt: Date;
    status: string;
    lastSentAt: Date | null;
    verifiedAt: Date | null;
    revokedAt: Date | null;
    blockedAt: Date | null;
    resourceIds: string[];
    deliverableCreationIds: string[];
    createdAt: Date;
    accessCode: string;
};
type PortalResource = {
    id: string;
    title: string;
    content: string;
    category: string;
    tags: string[];
    isPublic: boolean;
    format: string;
    fileUrl: string | null;
    createdAt: Date;
    updatedAt: Date;
};
type PortalDeliverable = {
    id: string;
    name: string;
    type: string;
    format: string;
    content: unknown;
    metadata: unknown;
    tags: string[];
    createdAt: Date;
    updatedAt: Date;
};
type TrackingSections = {
    alimentacion?: string;
    suplementos?: string;
    actividadFisica?: string;
};
export declare class PatientPortalsService {
    private readonly prisma;
    private readonly jwtService;
    private readonly configService;
    private readonly mailService;
    constructor(prisma: PrismaService, jwtService: JwtService, configService: ConfigService, mailService: MailService);
    createInvitation(nutritionistId: string, patientId: string, dto: CreatePatientPortalInvitationDto): Promise<{
        invitation: {
            id: string;
            createdAt: Date;
            email: string | null;
            status: string;
            expiresAt: Date;
        };
        shareUrl: string;
        expiresAt: Date;
        accessCode: string;
    }>;
    previewInvitation(token: string): Promise<{
        patientName: string;
        patientEmail: string | null;
        nutritionistName: string;
        expiresAt: Date;
    }>;
    verifyInvitation(token: string, email: string, accessCode: string): Promise<{
        patient: {
            id: string;
            createdAt: Date;
            nutritionist: {
                id: string;
                fullName: string;
                avatarUrl: string | null;
            };
            fullName: string;
            phone: string | null;
            projects: {
                name: string;
                id: string;
                updatedAt: Date;
                status: string;
                description: string | null;
                mode: string;
                activeDeliverableCreation: {
                    name: string;
                    id: string;
                    type: string;
                } | null;
                activeDietCreation: {
                    name: string;
                    id: string;
                    type: string;
                } | null;
                activeRecipeCreation: {
                    name: string;
                    id: string;
                    type: string;
                } | null;
            }[];
            email: string | null;
            status: string | null;
            documentId: string | null;
            height: number | null;
            weight: number | null;
        };
        portal: {
            activeInvitation: InvitationSummary | null;
            latestInvitation: InvitationSummary | null;
        };
        summary: {
            totalEntries: number;
            questionsCount: number;
            trackingCount: number;
            repliesCount: number;
            pendingQuestions: number;
            notificationsCount: number;
            latestEntryAt: Date;
            daysSinceLastEntry: number;
            sectionCounts: {
                alimentacion: number;
                suplementos: number;
                actividadFisica: number;
            };
            alerts: string[];
        };
        entries: NormalizedPortalEntry[];
        questions: NormalizedPortalEntry[];
        tracking: NormalizedPortalEntry[];
        replies: NormalizedPortalEntry[];
        notifications: NormalizedPortalEntry[];
        sharedResources: PortalResource[];
        sharedDeliverables: PortalDeliverable[];
        accessToken: string;
    }>;
    getPortalSessionOverview(session: PortalSessionPayload): Promise<{
        patient: {
            id: string;
            createdAt: Date;
            nutritionist: {
                id: string;
                fullName: string;
                avatarUrl: string | null;
            };
            fullName: string;
            phone: string | null;
            projects: {
                name: string;
                id: string;
                updatedAt: Date;
                status: string;
                description: string | null;
                mode: string;
                activeDeliverableCreation: {
                    name: string;
                    id: string;
                    type: string;
                } | null;
                activeDietCreation: {
                    name: string;
                    id: string;
                    type: string;
                } | null;
                activeRecipeCreation: {
                    name: string;
                    id: string;
                    type: string;
                } | null;
            }[];
            email: string | null;
            status: string | null;
            documentId: string | null;
            height: number | null;
            weight: number | null;
        };
        portal: {
            activeInvitation: InvitationSummary | null;
            latestInvitation: InvitationSummary | null;
        };
        summary: {
            totalEntries: number;
            questionsCount: number;
            trackingCount: number;
            repliesCount: number;
            pendingQuestions: number;
            notificationsCount: number;
            latestEntryAt: Date;
            daysSinceLastEntry: number;
            sectionCounts: {
                alimentacion: number;
                suplementos: number;
                actividadFisica: number;
            };
            alerts: string[];
        };
        entries: NormalizedPortalEntry[];
        questions: NormalizedPortalEntry[];
        tracking: NormalizedPortalEntry[];
        replies: NormalizedPortalEntry[];
        notifications: NormalizedPortalEntry[];
        sharedResources: PortalResource[];
        sharedDeliverables: PortalDeliverable[];
    }>;
    getPortalOverview(nutritionistId: string, patientId: string): Promise<{
        patient: {
            id: string;
            createdAt: Date;
            nutritionist: {
                id: string;
                fullName: string;
                avatarUrl: string | null;
            };
            fullName: string;
            phone: string | null;
            projects: {
                name: string;
                id: string;
                updatedAt: Date;
                status: string;
                description: string | null;
                mode: string;
                activeDeliverableCreation: {
                    name: string;
                    id: string;
                    type: string;
                } | null;
                activeDietCreation: {
                    name: string;
                    id: string;
                    type: string;
                } | null;
                activeRecipeCreation: {
                    name: string;
                    id: string;
                    type: string;
                } | null;
            }[];
            email: string | null;
            status: string | null;
            documentId: string | null;
            height: number | null;
            weight: number | null;
        };
        portal: {
            activeInvitation: InvitationSummary | null;
            latestInvitation: InvitationSummary | null;
        };
        summary: {
            totalEntries: number;
            questionsCount: number;
            trackingCount: number;
            repliesCount: number;
            pendingQuestions: number;
            notificationsCount: number;
            latestEntryAt: Date;
            daysSinceLastEntry: number;
            sectionCounts: {
                alimentacion: number;
                suplementos: number;
                actividadFisica: number;
            };
            alerts: string[];
        };
        entries: NormalizedPortalEntry[];
        questions: NormalizedPortalEntry[];
        tracking: NormalizedPortalEntry[];
        replies: NormalizedPortalEntry[];
        notifications: NormalizedPortalEntry[];
        sharedResources: PortalResource[];
        sharedDeliverables: PortalDeliverable[];
    }>;
    setAccessStatus(nutritionistId: string, patientId: string, status: 'ACTIVE' | 'BLOCKED'): Promise<{
        invitation: {
            id: string;
            updatedAt: Date;
            status: string;
            revokedAt: Date | null;
            blockedAt: Date | null;
        };
        overview: {
            patient: {
                id: string;
                createdAt: Date;
                nutritionist: {
                    id: string;
                    fullName: string;
                    avatarUrl: string | null;
                };
                fullName: string;
                phone: string | null;
                projects: {
                    name: string;
                    id: string;
                    updatedAt: Date;
                    status: string;
                    description: string | null;
                    mode: string;
                    activeDeliverableCreation: {
                        name: string;
                        id: string;
                        type: string;
                    } | null;
                    activeDietCreation: {
                        name: string;
                        id: string;
                        type: string;
                    } | null;
                    activeRecipeCreation: {
                        name: string;
                        id: string;
                        type: string;
                    } | null;
                }[];
                email: string | null;
                status: string | null;
                documentId: string | null;
                height: number | null;
                weight: number | null;
            };
            portal: {
                activeInvitation: InvitationSummary | null;
                latestInvitation: InvitationSummary | null;
            };
            summary: {
                totalEntries: number;
                questionsCount: number;
                trackingCount: number;
                repliesCount: number;
                pendingQuestions: number;
                notificationsCount: number;
                latestEntryAt: Date;
                daysSinceLastEntry: number;
                sectionCounts: {
                    alimentacion: number;
                    suplementos: number;
                    actividadFisica: number;
                };
                alerts: string[];
            };
            entries: NormalizedPortalEntry[];
            questions: NormalizedPortalEntry[];
            tracking: NormalizedPortalEntry[];
            replies: NormalizedPortalEntry[];
            notifications: NormalizedPortalEntry[];
            sharedResources: PortalResource[];
            sharedDeliverables: PortalDeliverable[];
        };
    }>;
    createQuestion(session: PortalSessionPayload, dto: CreatePatientPortalQuestionDto): Promise<{
        entry: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            payload: import("@prisma/client/runtime/library").JsonValue;
            kind: string;
            replyToId: string | null;
            body: string | null;
            replyTo: {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                payload: import("@prisma/client/runtime/library").JsonValue;
                kind: string;
                replyToId: string | null;
                body: string | null;
            } | null;
            replies: {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                payload: import("@prisma/client/runtime/library").JsonValue;
                kind: string;
                replyToId: string | null;
                body: string | null;
            }[];
        };
        overview: {
            patient: {
                id: string;
                createdAt: Date;
                nutritionist: {
                    id: string;
                    fullName: string;
                    avatarUrl: string | null;
                };
                fullName: string;
                phone: string | null;
                projects: {
                    name: string;
                    id: string;
                    updatedAt: Date;
                    status: string;
                    description: string | null;
                    mode: string;
                    activeDeliverableCreation: {
                        name: string;
                        id: string;
                        type: string;
                    } | null;
                    activeDietCreation: {
                        name: string;
                        id: string;
                        type: string;
                    } | null;
                    activeRecipeCreation: {
                        name: string;
                        id: string;
                        type: string;
                    } | null;
                }[];
                email: string | null;
                status: string | null;
                documentId: string | null;
                height: number | null;
                weight: number | null;
            };
            portal: {
                activeInvitation: InvitationSummary | null;
                latestInvitation: InvitationSummary | null;
            };
            summary: {
                totalEntries: number;
                questionsCount: number;
                trackingCount: number;
                repliesCount: number;
                pendingQuestions: number;
                notificationsCount: number;
                latestEntryAt: Date;
                daysSinceLastEntry: number;
                sectionCounts: {
                    alimentacion: number;
                    suplementos: number;
                    actividadFisica: number;
                };
                alerts: string[];
            };
            entries: NormalizedPortalEntry[];
            questions: NormalizedPortalEntry[];
            tracking: NormalizedPortalEntry[];
            replies: NormalizedPortalEntry[];
            notifications: NormalizedPortalEntry[];
            sharedResources: PortalResource[];
            sharedDeliverables: PortalDeliverable[];
        };
    }>;
    createTrackingEntry(session: PortalSessionPayload, dto: CreatePatientPortalEntryDto): Promise<{
        entry: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            payload: import("@prisma/client/runtime/library").JsonValue;
            kind: string;
            replyToId: string | null;
            body: string | null;
            replyTo: {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                payload: import("@prisma/client/runtime/library").JsonValue;
                kind: string;
                replyToId: string | null;
                body: string | null;
            } | null;
            replies: {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                payload: import("@prisma/client/runtime/library").JsonValue;
                kind: string;
                replyToId: string | null;
                body: string | null;
            }[];
        };
        overview: {
            patient: {
                id: string;
                createdAt: Date;
                nutritionist: {
                    id: string;
                    fullName: string;
                    avatarUrl: string | null;
                };
                fullName: string;
                phone: string | null;
                projects: {
                    name: string;
                    id: string;
                    updatedAt: Date;
                    status: string;
                    description: string | null;
                    mode: string;
                    activeDeliverableCreation: {
                        name: string;
                        id: string;
                        type: string;
                    } | null;
                    activeDietCreation: {
                        name: string;
                        id: string;
                        type: string;
                    } | null;
                    activeRecipeCreation: {
                        name: string;
                        id: string;
                        type: string;
                    } | null;
                }[];
                email: string | null;
                status: string | null;
                documentId: string | null;
                height: number | null;
                weight: number | null;
            };
            portal: {
                activeInvitation: InvitationSummary | null;
                latestInvitation: InvitationSummary | null;
            };
            summary: {
                totalEntries: number;
                questionsCount: number;
                trackingCount: number;
                repliesCount: number;
                pendingQuestions: number;
                notificationsCount: number;
                latestEntryAt: Date;
                daysSinceLastEntry: number;
                sectionCounts: {
                    alimentacion: number;
                    suplementos: number;
                    actividadFisica: number;
                };
                alerts: string[];
            };
            entries: NormalizedPortalEntry[];
            questions: NormalizedPortalEntry[];
            tracking: NormalizedPortalEntry[];
            replies: NormalizedPortalEntry[];
            notifications: NormalizedPortalEntry[];
            sharedResources: PortalResource[];
            sharedDeliverables: PortalDeliverable[];
        };
    }>;
    createReply(nutritionistId: string, patientId: string, dto: CreatePatientPortalReplyDto): Promise<{
        entry: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            payload: import("@prisma/client/runtime/library").JsonValue;
            kind: string;
            replyToId: string | null;
            body: string | null;
            replyTo: {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                payload: import("@prisma/client/runtime/library").JsonValue;
                kind: string;
                replyToId: string | null;
                body: string | null;
            } | null;
            replies: {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                payload: import("@prisma/client/runtime/library").JsonValue;
                kind: string;
                replyToId: string | null;
                body: string | null;
            }[];
        };
        overview: {
            patient: {
                id: string;
                createdAt: Date;
                nutritionist: {
                    id: string;
                    fullName: string;
                    avatarUrl: string | null;
                };
                fullName: string;
                phone: string | null;
                projects: {
                    name: string;
                    id: string;
                    updatedAt: Date;
                    status: string;
                    description: string | null;
                    mode: string;
                    activeDeliverableCreation: {
                        name: string;
                        id: string;
                        type: string;
                    } | null;
                    activeDietCreation: {
                        name: string;
                        id: string;
                        type: string;
                    } | null;
                    activeRecipeCreation: {
                        name: string;
                        id: string;
                        type: string;
                    } | null;
                }[];
                email: string | null;
                status: string | null;
                documentId: string | null;
                height: number | null;
                weight: number | null;
            };
            portal: {
                activeInvitation: InvitationSummary | null;
                latestInvitation: InvitationSummary | null;
            };
            summary: {
                totalEntries: number;
                questionsCount: number;
                trackingCount: number;
                repliesCount: number;
                pendingQuestions: number;
                notificationsCount: number;
                latestEntryAt: Date;
                daysSinceLastEntry: number;
                sectionCounts: {
                    alimentacion: number;
                    suplementos: number;
                    actividadFisica: number;
                };
                alerts: string[];
            };
            entries: NormalizedPortalEntry[];
            questions: NormalizedPortalEntry[];
            tracking: NormalizedPortalEntry[];
            replies: NormalizedPortalEntry[];
            notifications: NormalizedPortalEntry[];
            sharedResources: PortalResource[];
            sharedDeliverables: PortalDeliverable[];
        };
    }>;
    createNotification(nutritionistId: string, patientId: string, dto: CreatePatientPortalNotificationDto): Promise<{
        entry: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            payload: import("@prisma/client/runtime/library").JsonValue;
            kind: string;
            replyToId: string | null;
            body: string | null;
            replyTo: {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                payload: import("@prisma/client/runtime/library").JsonValue;
                kind: string;
                replyToId: string | null;
                body: string | null;
            } | null;
            replies: {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                payload: import("@prisma/client/runtime/library").JsonValue;
                kind: string;
                replyToId: string | null;
                body: string | null;
            }[];
        };
        overview: {
            patient: {
                id: string;
                createdAt: Date;
                nutritionist: {
                    id: string;
                    fullName: string;
                    avatarUrl: string | null;
                };
                fullName: string;
                phone: string | null;
                projects: {
                    name: string;
                    id: string;
                    updatedAt: Date;
                    status: string;
                    description: string | null;
                    mode: string;
                    activeDeliverableCreation: {
                        name: string;
                        id: string;
                        type: string;
                    } | null;
                    activeDietCreation: {
                        name: string;
                        id: string;
                        type: string;
                    } | null;
                    activeRecipeCreation: {
                        name: string;
                        id: string;
                        type: string;
                    } | null;
                }[];
                email: string | null;
                status: string | null;
                documentId: string | null;
                height: number | null;
                weight: number | null;
            };
            portal: {
                activeInvitation: InvitationSummary | null;
                latestInvitation: InvitationSummary | null;
            };
            summary: {
                totalEntries: number;
                questionsCount: number;
                trackingCount: number;
                repliesCount: number;
                pendingQuestions: number;
                notificationsCount: number;
                latestEntryAt: Date;
                daysSinceLastEntry: number;
                sectionCounts: {
                    alimentacion: number;
                    suplementos: number;
                    actividadFisica: number;
                };
                alerts: string[];
            };
            entries: NormalizedPortalEntry[];
            questions: NormalizedPortalEntry[];
            tracking: NormalizedPortalEntry[];
            replies: NormalizedPortalEntry[];
            notifications: NormalizedPortalEntry[];
            sharedResources: PortalResource[];
            sharedDeliverables: PortalDeliverable[];
        };
    }>;
    private buildOverview;
    private buildSummary;
    private buildTrackingSections;
    private buildTrackingSummary;
    private normalizeDiaryDate;
    private normalizeEntry;
    private formatInvitationSummary;
    private findInvitationByToken;
    private getPortalAccessCode;
    private formatAccessCodeForDisplay;
    private buildPortalUrl;
    private hashToken;
    private normalizeEmail;
    private normalizeAccessCode;
}
export {};
