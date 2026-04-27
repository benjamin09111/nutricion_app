import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../prisma/prisma.service';
import { MailService } from '../mail/mail.service';
import { CreatePatientPortalInvitationDto } from './dto/create-patient-portal-invitation.dto';
import { CreatePatientPortalEntryDto } from './dto/create-patient-portal-entry.dto';
import { CreatePatientPortalQuestionDto } from './dto/create-patient-portal-question.dto';
import { CreatePatientPortalReplyDto } from './dto/create-patient-portal-reply.dto';
type PortalSessionPayload = {
    kind: 'patient-portal';
    patientId: string;
    nutritionistId: string;
    invitationId: string;
};
type PortalEntryKind = 'QUESTION' | 'TRACKING' | 'REPLY';
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
    sections?: TrackingSections;
    source?: 'patient' | 'nutritionist';
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
    createdAt: Date;
    accessCode: string;
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
            email: string | null;
            status: string;
            expiresAt: Date;
            createdAt: Date;
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
            nutritionist: {
                id: string;
                fullName: string;
                avatarUrl: string | null;
            };
            id: string;
            email: string | null;
            status: string | null;
            createdAt: Date;
            fullName: string;
            phone: string | null;
            documentId: string | null;
            height: number | null;
            weight: number | null;
            projects: {
                name: string;
                id: string;
                status: string;
                updatedAt: Date;
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
            latestEntryAt: Date;
            daysSinceLastEntry: number | null;
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
        accessToken: string;
    }>;
    getPortalSessionOverview(session: PortalSessionPayload): Promise<{
        patient: {
            nutritionist: {
                id: string;
                fullName: string;
                avatarUrl: string | null;
            };
            id: string;
            email: string | null;
            status: string | null;
            createdAt: Date;
            fullName: string;
            phone: string | null;
            documentId: string | null;
            height: number | null;
            weight: number | null;
            projects: {
                name: string;
                id: string;
                status: string;
                updatedAt: Date;
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
            latestEntryAt: Date;
            daysSinceLastEntry: number | null;
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
    }>;
    getPortalOverview(nutritionistId: string, patientId: string): Promise<{
        patient: {
            nutritionist: {
                id: string;
                fullName: string;
                avatarUrl: string | null;
            };
            id: string;
            email: string | null;
            status: string | null;
            createdAt: Date;
            fullName: string;
            phone: string | null;
            documentId: string | null;
            height: number | null;
            weight: number | null;
            projects: {
                name: string;
                id: string;
                status: string;
                updatedAt: Date;
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
            latestEntryAt: Date;
            daysSinceLastEntry: number | null;
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
    }>;
    setAccessStatus(nutritionistId: string, patientId: string, status: 'ACTIVE' | 'BLOCKED'): Promise<{
        invitation: {
            id: string;
            status: string;
            revokedAt: Date | null;
            blockedAt: Date | null;
            updatedAt: Date;
        };
        overview: {
            patient: {
                nutritionist: {
                    id: string;
                    fullName: string;
                    avatarUrl: string | null;
                };
                id: string;
                email: string | null;
                status: string | null;
                createdAt: Date;
                fullName: string;
                phone: string | null;
                documentId: string | null;
                height: number | null;
                weight: number | null;
                projects: {
                    name: string;
                    id: string;
                    status: string;
                    updatedAt: Date;
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
                latestEntryAt: Date;
                daysSinceLastEntry: number | null;
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
        };
    }>;
    createQuestion(session: PortalSessionPayload, dto: CreatePatientPortalQuestionDto): Promise<{
        entry: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            kind: string;
            replyToId: string | null;
            body: string | null;
            payload: import("@prisma/client/runtime/library").JsonValue;
            replyTo: {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                kind: string;
                replyToId: string | null;
                body: string | null;
                payload: import("@prisma/client/runtime/library").JsonValue;
            } | null;
            replies: {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                kind: string;
                replyToId: string | null;
                body: string | null;
                payload: import("@prisma/client/runtime/library").JsonValue;
            }[];
        };
        overview: {
            patient: {
                nutritionist: {
                    id: string;
                    fullName: string;
                    avatarUrl: string | null;
                };
                id: string;
                email: string | null;
                status: string | null;
                createdAt: Date;
                fullName: string;
                phone: string | null;
                documentId: string | null;
                height: number | null;
                weight: number | null;
                projects: {
                    name: string;
                    id: string;
                    status: string;
                    updatedAt: Date;
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
                latestEntryAt: Date;
                daysSinceLastEntry: number | null;
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
        };
    }>;
    createTrackingEntry(session: PortalSessionPayload, dto: CreatePatientPortalEntryDto): Promise<{
        entry: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            kind: string;
            replyToId: string | null;
            body: string | null;
            payload: import("@prisma/client/runtime/library").JsonValue;
            replyTo: {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                kind: string;
                replyToId: string | null;
                body: string | null;
                payload: import("@prisma/client/runtime/library").JsonValue;
            } | null;
            replies: {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                kind: string;
                replyToId: string | null;
                body: string | null;
                payload: import("@prisma/client/runtime/library").JsonValue;
            }[];
        };
        overview: {
            patient: {
                nutritionist: {
                    id: string;
                    fullName: string;
                    avatarUrl: string | null;
                };
                id: string;
                email: string | null;
                status: string | null;
                createdAt: Date;
                fullName: string;
                phone: string | null;
                documentId: string | null;
                height: number | null;
                weight: number | null;
                projects: {
                    name: string;
                    id: string;
                    status: string;
                    updatedAt: Date;
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
                latestEntryAt: Date;
                daysSinceLastEntry: number | null;
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
        };
    }>;
    createReply(nutritionistId: string, patientId: string, dto: CreatePatientPortalReplyDto): Promise<{
        entry: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            kind: string;
            replyToId: string | null;
            body: string | null;
            payload: import("@prisma/client/runtime/library").JsonValue;
            replyTo: {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                kind: string;
                replyToId: string | null;
                body: string | null;
                payload: import("@prisma/client/runtime/library").JsonValue;
            } | null;
            replies: {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                kind: string;
                replyToId: string | null;
                body: string | null;
                payload: import("@prisma/client/runtime/library").JsonValue;
            }[];
        };
        overview: {
            patient: {
                nutritionist: {
                    id: string;
                    fullName: string;
                    avatarUrl: string | null;
                };
                id: string;
                email: string | null;
                status: string | null;
                createdAt: Date;
                fullName: string;
                phone: string | null;
                documentId: string | null;
                height: number | null;
                weight: number | null;
                projects: {
                    name: string;
                    id: string;
                    status: string;
                    updatedAt: Date;
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
                latestEntryAt: Date;
                daysSinceLastEntry: number | null;
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
        };
    }>;
    private buildOverview;
    private buildSummary;
    private buildTrackingSections;
    private buildTrackingSummary;
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
