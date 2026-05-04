import { PatientPortalsService } from './patient-portals.service';
import { CreatePatientPortalInvitationDto } from './dto/create-patient-portal-invitation.dto';
import { CreatePatientPortalEntryDto } from './dto/create-patient-portal-entry.dto';
import { CreatePatientPortalQuestionDto } from './dto/create-patient-portal-question.dto';
import { CreatePatientPortalReplyDto } from './dto/create-patient-portal-reply.dto';
import { CreatePatientPortalNotificationDto } from './dto/create-patient-portal-notification.dto';
export declare class PatientPortalsController {
    private readonly patientPortalsService;
    constructor(patientPortalsService: PatientPortalsService);
    createInvitation(req: any, patientId: string, dto: CreatePatientPortalInvitationDto): Promise<{
        invitation: {
            id: string;
            email: string | null;
            status: string;
            createdAt: Date;
            expiresAt: Date;
        };
        shareUrl: string;
        expiresAt: Date;
        accessCode: string;
    }>;
    getPatientOverview(req: any, patientId: string): Promise<{
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
            projects: {
                id: string;
                name: string;
                mode: string;
                status: string;
                updatedAt: Date;
                description: string | null;
                activeDeliverableCreation: {
                    id: string;
                    name: string;
                    type: string;
                } | null;
                activeDietCreation: {
                    id: string;
                    name: string;
                    type: string;
                } | null;
                activeRecipeCreation: {
                    id: string;
                    name: string;
                    type: string;
                } | null;
            }[];
            documentId: string | null;
            height: number | null;
            weight: number | null;
        };
        portal: {
            activeInvitation: {
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
            } | null;
            latestInvitation: {
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
            } | null;
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
        entries: {
            id: string;
            kind: "QUESTION" | "TRACKING" | "REPLY" | "NOTIFICATION";
            body?: string | null;
            payload: {
                entryDate?: string;
                sections?: {
                    alimentacion?: string;
                    suplementos?: string;
                    actividadFisica?: string;
                };
                source?: "patient" | "nutritionist";
                notificationTitle?: string;
                notificationType?: "INFO" | "REMINDER" | "ALERT";
            };
            replyToId?: string | null;
            createdAt: Date;
            updatedAt: Date;
            replyTo: {
                id: string;
                kind: "QUESTION" | "TRACKING" | "REPLY" | "NOTIFICATION";
                body?: string | null;
                payload: {
                    entryDate?: string;
                    sections?: {
                        alimentacion?: string;
                        suplementos?: string;
                        actividadFisica?: string;
                    };
                    source?: "patient" | "nutritionist";
                    notificationTitle?: string;
                    notificationType?: "INFO" | "REMINDER" | "ALERT";
                };
                replyToId?: string | null;
                createdAt: Date;
                updatedAt: Date;
            } | null;
            replies: Array<{
                id: string;
                kind: "QUESTION" | "TRACKING" | "REPLY" | "NOTIFICATION";
                body?: string | null;
                payload: {
                    entryDate?: string;
                    sections?: {
                        alimentacion?: string;
                        suplementos?: string;
                        actividadFisica?: string;
                    };
                    source?: "patient" | "nutritionist";
                    notificationTitle?: string;
                    notificationType?: "INFO" | "REMINDER" | "ALERT";
                };
                replyToId?: string | null;
                createdAt: Date;
                updatedAt: Date;
            }>;
        }[];
        questions: {
            id: string;
            kind: "QUESTION" | "TRACKING" | "REPLY" | "NOTIFICATION";
            body?: string | null;
            payload: {
                entryDate?: string;
                sections?: {
                    alimentacion?: string;
                    suplementos?: string;
                    actividadFisica?: string;
                };
                source?: "patient" | "nutritionist";
                notificationTitle?: string;
                notificationType?: "INFO" | "REMINDER" | "ALERT";
            };
            replyToId?: string | null;
            createdAt: Date;
            updatedAt: Date;
            replyTo: {
                id: string;
                kind: "QUESTION" | "TRACKING" | "REPLY" | "NOTIFICATION";
                body?: string | null;
                payload: {
                    entryDate?: string;
                    sections?: {
                        alimentacion?: string;
                        suplementos?: string;
                        actividadFisica?: string;
                    };
                    source?: "patient" | "nutritionist";
                    notificationTitle?: string;
                    notificationType?: "INFO" | "REMINDER" | "ALERT";
                };
                replyToId?: string | null;
                createdAt: Date;
                updatedAt: Date;
            } | null;
            replies: Array<{
                id: string;
                kind: "QUESTION" | "TRACKING" | "REPLY" | "NOTIFICATION";
                body?: string | null;
                payload: {
                    entryDate?: string;
                    sections?: {
                        alimentacion?: string;
                        suplementos?: string;
                        actividadFisica?: string;
                    };
                    source?: "patient" | "nutritionist";
                    notificationTitle?: string;
                    notificationType?: "INFO" | "REMINDER" | "ALERT";
                };
                replyToId?: string | null;
                createdAt: Date;
                updatedAt: Date;
            }>;
        }[];
        tracking: {
            id: string;
            kind: "QUESTION" | "TRACKING" | "REPLY" | "NOTIFICATION";
            body?: string | null;
            payload: {
                entryDate?: string;
                sections?: {
                    alimentacion?: string;
                    suplementos?: string;
                    actividadFisica?: string;
                };
                source?: "patient" | "nutritionist";
                notificationTitle?: string;
                notificationType?: "INFO" | "REMINDER" | "ALERT";
            };
            replyToId?: string | null;
            createdAt: Date;
            updatedAt: Date;
            replyTo: {
                id: string;
                kind: "QUESTION" | "TRACKING" | "REPLY" | "NOTIFICATION";
                body?: string | null;
                payload: {
                    entryDate?: string;
                    sections?: {
                        alimentacion?: string;
                        suplementos?: string;
                        actividadFisica?: string;
                    };
                    source?: "patient" | "nutritionist";
                    notificationTitle?: string;
                    notificationType?: "INFO" | "REMINDER" | "ALERT";
                };
                replyToId?: string | null;
                createdAt: Date;
                updatedAt: Date;
            } | null;
            replies: Array<{
                id: string;
                kind: "QUESTION" | "TRACKING" | "REPLY" | "NOTIFICATION";
                body?: string | null;
                payload: {
                    entryDate?: string;
                    sections?: {
                        alimentacion?: string;
                        suplementos?: string;
                        actividadFisica?: string;
                    };
                    source?: "patient" | "nutritionist";
                    notificationTitle?: string;
                    notificationType?: "INFO" | "REMINDER" | "ALERT";
                };
                replyToId?: string | null;
                createdAt: Date;
                updatedAt: Date;
            }>;
        }[];
        replies: {
            id: string;
            kind: "QUESTION" | "TRACKING" | "REPLY" | "NOTIFICATION";
            body?: string | null;
            payload: {
                entryDate?: string;
                sections?: {
                    alimentacion?: string;
                    suplementos?: string;
                    actividadFisica?: string;
                };
                source?: "patient" | "nutritionist";
                notificationTitle?: string;
                notificationType?: "INFO" | "REMINDER" | "ALERT";
            };
            replyToId?: string | null;
            createdAt: Date;
            updatedAt: Date;
            replyTo: {
                id: string;
                kind: "QUESTION" | "TRACKING" | "REPLY" | "NOTIFICATION";
                body?: string | null;
                payload: {
                    entryDate?: string;
                    sections?: {
                        alimentacion?: string;
                        suplementos?: string;
                        actividadFisica?: string;
                    };
                    source?: "patient" | "nutritionist";
                    notificationTitle?: string;
                    notificationType?: "INFO" | "REMINDER" | "ALERT";
                };
                replyToId?: string | null;
                createdAt: Date;
                updatedAt: Date;
            } | null;
            replies: Array<{
                id: string;
                kind: "QUESTION" | "TRACKING" | "REPLY" | "NOTIFICATION";
                body?: string | null;
                payload: {
                    entryDate?: string;
                    sections?: {
                        alimentacion?: string;
                        suplementos?: string;
                        actividadFisica?: string;
                    };
                    source?: "patient" | "nutritionist";
                    notificationTitle?: string;
                    notificationType?: "INFO" | "REMINDER" | "ALERT";
                };
                replyToId?: string | null;
                createdAt: Date;
                updatedAt: Date;
            }>;
        }[];
        notifications: {
            id: string;
            kind: "QUESTION" | "TRACKING" | "REPLY" | "NOTIFICATION";
            body?: string | null;
            payload: {
                entryDate?: string;
                sections?: {
                    alimentacion?: string;
                    suplementos?: string;
                    actividadFisica?: string;
                };
                source?: "patient" | "nutritionist";
                notificationTitle?: string;
                notificationType?: "INFO" | "REMINDER" | "ALERT";
            };
            replyToId?: string | null;
            createdAt: Date;
            updatedAt: Date;
            replyTo: {
                id: string;
                kind: "QUESTION" | "TRACKING" | "REPLY" | "NOTIFICATION";
                body?: string | null;
                payload: {
                    entryDate?: string;
                    sections?: {
                        alimentacion?: string;
                        suplementos?: string;
                        actividadFisica?: string;
                    };
                    source?: "patient" | "nutritionist";
                    notificationTitle?: string;
                    notificationType?: "INFO" | "REMINDER" | "ALERT";
                };
                replyToId?: string | null;
                createdAt: Date;
                updatedAt: Date;
            } | null;
            replies: Array<{
                id: string;
                kind: "QUESTION" | "TRACKING" | "REPLY" | "NOTIFICATION";
                body?: string | null;
                payload: {
                    entryDate?: string;
                    sections?: {
                        alimentacion?: string;
                        suplementos?: string;
                        actividadFisica?: string;
                    };
                    source?: "patient" | "nutritionist";
                    notificationTitle?: string;
                    notificationType?: "INFO" | "REMINDER" | "ALERT";
                };
                replyToId?: string | null;
                createdAt: Date;
                updatedAt: Date;
            }>;
        }[];
        sharedResources: {
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
        }[];
        sharedDeliverables: {
            id: string;
            name: string;
            type: string;
            format: string;
            content: unknown;
            metadata: unknown;
            tags: string[];
            createdAt: Date;
            updatedAt: Date;
        }[];
    }>;
    previewInvitation(token: string): Promise<{
        patientName: string;
        patientEmail: string | null;
        nutritionistName: string;
        expiresAt: Date;
    }>;
    verifyInvitation(token: string, body: {
        email: string;
        accessCode: string;
    }): Promise<{
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
            projects: {
                id: string;
                name: string;
                mode: string;
                status: string;
                updatedAt: Date;
                description: string | null;
                activeDeliverableCreation: {
                    id: string;
                    name: string;
                    type: string;
                } | null;
                activeDietCreation: {
                    id: string;
                    name: string;
                    type: string;
                } | null;
                activeRecipeCreation: {
                    id: string;
                    name: string;
                    type: string;
                } | null;
            }[];
            documentId: string | null;
            height: number | null;
            weight: number | null;
        };
        portal: {
            activeInvitation: {
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
            } | null;
            latestInvitation: {
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
            } | null;
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
        entries: {
            id: string;
            kind: "QUESTION" | "TRACKING" | "REPLY" | "NOTIFICATION";
            body?: string | null;
            payload: {
                entryDate?: string;
                sections?: {
                    alimentacion?: string;
                    suplementos?: string;
                    actividadFisica?: string;
                };
                source?: "patient" | "nutritionist";
                notificationTitle?: string;
                notificationType?: "INFO" | "REMINDER" | "ALERT";
            };
            replyToId?: string | null;
            createdAt: Date;
            updatedAt: Date;
            replyTo: {
                id: string;
                kind: "QUESTION" | "TRACKING" | "REPLY" | "NOTIFICATION";
                body?: string | null;
                payload: {
                    entryDate?: string;
                    sections?: {
                        alimentacion?: string;
                        suplementos?: string;
                        actividadFisica?: string;
                    };
                    source?: "patient" | "nutritionist";
                    notificationTitle?: string;
                    notificationType?: "INFO" | "REMINDER" | "ALERT";
                };
                replyToId?: string | null;
                createdAt: Date;
                updatedAt: Date;
            } | null;
            replies: Array<{
                id: string;
                kind: "QUESTION" | "TRACKING" | "REPLY" | "NOTIFICATION";
                body?: string | null;
                payload: {
                    entryDate?: string;
                    sections?: {
                        alimentacion?: string;
                        suplementos?: string;
                        actividadFisica?: string;
                    };
                    source?: "patient" | "nutritionist";
                    notificationTitle?: string;
                    notificationType?: "INFO" | "REMINDER" | "ALERT";
                };
                replyToId?: string | null;
                createdAt: Date;
                updatedAt: Date;
            }>;
        }[];
        questions: {
            id: string;
            kind: "QUESTION" | "TRACKING" | "REPLY" | "NOTIFICATION";
            body?: string | null;
            payload: {
                entryDate?: string;
                sections?: {
                    alimentacion?: string;
                    suplementos?: string;
                    actividadFisica?: string;
                };
                source?: "patient" | "nutritionist";
                notificationTitle?: string;
                notificationType?: "INFO" | "REMINDER" | "ALERT";
            };
            replyToId?: string | null;
            createdAt: Date;
            updatedAt: Date;
            replyTo: {
                id: string;
                kind: "QUESTION" | "TRACKING" | "REPLY" | "NOTIFICATION";
                body?: string | null;
                payload: {
                    entryDate?: string;
                    sections?: {
                        alimentacion?: string;
                        suplementos?: string;
                        actividadFisica?: string;
                    };
                    source?: "patient" | "nutritionist";
                    notificationTitle?: string;
                    notificationType?: "INFO" | "REMINDER" | "ALERT";
                };
                replyToId?: string | null;
                createdAt: Date;
                updatedAt: Date;
            } | null;
            replies: Array<{
                id: string;
                kind: "QUESTION" | "TRACKING" | "REPLY" | "NOTIFICATION";
                body?: string | null;
                payload: {
                    entryDate?: string;
                    sections?: {
                        alimentacion?: string;
                        suplementos?: string;
                        actividadFisica?: string;
                    };
                    source?: "patient" | "nutritionist";
                    notificationTitle?: string;
                    notificationType?: "INFO" | "REMINDER" | "ALERT";
                };
                replyToId?: string | null;
                createdAt: Date;
                updatedAt: Date;
            }>;
        }[];
        tracking: {
            id: string;
            kind: "QUESTION" | "TRACKING" | "REPLY" | "NOTIFICATION";
            body?: string | null;
            payload: {
                entryDate?: string;
                sections?: {
                    alimentacion?: string;
                    suplementos?: string;
                    actividadFisica?: string;
                };
                source?: "patient" | "nutritionist";
                notificationTitle?: string;
                notificationType?: "INFO" | "REMINDER" | "ALERT";
            };
            replyToId?: string | null;
            createdAt: Date;
            updatedAt: Date;
            replyTo: {
                id: string;
                kind: "QUESTION" | "TRACKING" | "REPLY" | "NOTIFICATION";
                body?: string | null;
                payload: {
                    entryDate?: string;
                    sections?: {
                        alimentacion?: string;
                        suplementos?: string;
                        actividadFisica?: string;
                    };
                    source?: "patient" | "nutritionist";
                    notificationTitle?: string;
                    notificationType?: "INFO" | "REMINDER" | "ALERT";
                };
                replyToId?: string | null;
                createdAt: Date;
                updatedAt: Date;
            } | null;
            replies: Array<{
                id: string;
                kind: "QUESTION" | "TRACKING" | "REPLY" | "NOTIFICATION";
                body?: string | null;
                payload: {
                    entryDate?: string;
                    sections?: {
                        alimentacion?: string;
                        suplementos?: string;
                        actividadFisica?: string;
                    };
                    source?: "patient" | "nutritionist";
                    notificationTitle?: string;
                    notificationType?: "INFO" | "REMINDER" | "ALERT";
                };
                replyToId?: string | null;
                createdAt: Date;
                updatedAt: Date;
            }>;
        }[];
        replies: {
            id: string;
            kind: "QUESTION" | "TRACKING" | "REPLY" | "NOTIFICATION";
            body?: string | null;
            payload: {
                entryDate?: string;
                sections?: {
                    alimentacion?: string;
                    suplementos?: string;
                    actividadFisica?: string;
                };
                source?: "patient" | "nutritionist";
                notificationTitle?: string;
                notificationType?: "INFO" | "REMINDER" | "ALERT";
            };
            replyToId?: string | null;
            createdAt: Date;
            updatedAt: Date;
            replyTo: {
                id: string;
                kind: "QUESTION" | "TRACKING" | "REPLY" | "NOTIFICATION";
                body?: string | null;
                payload: {
                    entryDate?: string;
                    sections?: {
                        alimentacion?: string;
                        suplementos?: string;
                        actividadFisica?: string;
                    };
                    source?: "patient" | "nutritionist";
                    notificationTitle?: string;
                    notificationType?: "INFO" | "REMINDER" | "ALERT";
                };
                replyToId?: string | null;
                createdAt: Date;
                updatedAt: Date;
            } | null;
            replies: Array<{
                id: string;
                kind: "QUESTION" | "TRACKING" | "REPLY" | "NOTIFICATION";
                body?: string | null;
                payload: {
                    entryDate?: string;
                    sections?: {
                        alimentacion?: string;
                        suplementos?: string;
                        actividadFisica?: string;
                    };
                    source?: "patient" | "nutritionist";
                    notificationTitle?: string;
                    notificationType?: "INFO" | "REMINDER" | "ALERT";
                };
                replyToId?: string | null;
                createdAt: Date;
                updatedAt: Date;
            }>;
        }[];
        notifications: {
            id: string;
            kind: "QUESTION" | "TRACKING" | "REPLY" | "NOTIFICATION";
            body?: string | null;
            payload: {
                entryDate?: string;
                sections?: {
                    alimentacion?: string;
                    suplementos?: string;
                    actividadFisica?: string;
                };
                source?: "patient" | "nutritionist";
                notificationTitle?: string;
                notificationType?: "INFO" | "REMINDER" | "ALERT";
            };
            replyToId?: string | null;
            createdAt: Date;
            updatedAt: Date;
            replyTo: {
                id: string;
                kind: "QUESTION" | "TRACKING" | "REPLY" | "NOTIFICATION";
                body?: string | null;
                payload: {
                    entryDate?: string;
                    sections?: {
                        alimentacion?: string;
                        suplementos?: string;
                        actividadFisica?: string;
                    };
                    source?: "patient" | "nutritionist";
                    notificationTitle?: string;
                    notificationType?: "INFO" | "REMINDER" | "ALERT";
                };
                replyToId?: string | null;
                createdAt: Date;
                updatedAt: Date;
            } | null;
            replies: Array<{
                id: string;
                kind: "QUESTION" | "TRACKING" | "REPLY" | "NOTIFICATION";
                body?: string | null;
                payload: {
                    entryDate?: string;
                    sections?: {
                        alimentacion?: string;
                        suplementos?: string;
                        actividadFisica?: string;
                    };
                    source?: "patient" | "nutritionist";
                    notificationTitle?: string;
                    notificationType?: "INFO" | "REMINDER" | "ALERT";
                };
                replyToId?: string | null;
                createdAt: Date;
                updatedAt: Date;
            }>;
        }[];
        sharedResources: {
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
        }[];
        sharedDeliverables: {
            id: string;
            name: string;
            type: string;
            format: string;
            content: unknown;
            metadata: unknown;
            tags: string[];
            createdAt: Date;
            updatedAt: Date;
        }[];
        accessToken: string;
    }>;
    getMyPortal(req: any): Promise<{
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
            projects: {
                id: string;
                name: string;
                mode: string;
                status: string;
                updatedAt: Date;
                description: string | null;
                activeDeliverableCreation: {
                    id: string;
                    name: string;
                    type: string;
                } | null;
                activeDietCreation: {
                    id: string;
                    name: string;
                    type: string;
                } | null;
                activeRecipeCreation: {
                    id: string;
                    name: string;
                    type: string;
                } | null;
            }[];
            documentId: string | null;
            height: number | null;
            weight: number | null;
        };
        portal: {
            activeInvitation: {
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
            } | null;
            latestInvitation: {
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
            } | null;
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
        entries: {
            id: string;
            kind: "QUESTION" | "TRACKING" | "REPLY" | "NOTIFICATION";
            body?: string | null;
            payload: {
                entryDate?: string;
                sections?: {
                    alimentacion?: string;
                    suplementos?: string;
                    actividadFisica?: string;
                };
                source?: "patient" | "nutritionist";
                notificationTitle?: string;
                notificationType?: "INFO" | "REMINDER" | "ALERT";
            };
            replyToId?: string | null;
            createdAt: Date;
            updatedAt: Date;
            replyTo: {
                id: string;
                kind: "QUESTION" | "TRACKING" | "REPLY" | "NOTIFICATION";
                body?: string | null;
                payload: {
                    entryDate?: string;
                    sections?: {
                        alimentacion?: string;
                        suplementos?: string;
                        actividadFisica?: string;
                    };
                    source?: "patient" | "nutritionist";
                    notificationTitle?: string;
                    notificationType?: "INFO" | "REMINDER" | "ALERT";
                };
                replyToId?: string | null;
                createdAt: Date;
                updatedAt: Date;
            } | null;
            replies: Array<{
                id: string;
                kind: "QUESTION" | "TRACKING" | "REPLY" | "NOTIFICATION";
                body?: string | null;
                payload: {
                    entryDate?: string;
                    sections?: {
                        alimentacion?: string;
                        suplementos?: string;
                        actividadFisica?: string;
                    };
                    source?: "patient" | "nutritionist";
                    notificationTitle?: string;
                    notificationType?: "INFO" | "REMINDER" | "ALERT";
                };
                replyToId?: string | null;
                createdAt: Date;
                updatedAt: Date;
            }>;
        }[];
        questions: {
            id: string;
            kind: "QUESTION" | "TRACKING" | "REPLY" | "NOTIFICATION";
            body?: string | null;
            payload: {
                entryDate?: string;
                sections?: {
                    alimentacion?: string;
                    suplementos?: string;
                    actividadFisica?: string;
                };
                source?: "patient" | "nutritionist";
                notificationTitle?: string;
                notificationType?: "INFO" | "REMINDER" | "ALERT";
            };
            replyToId?: string | null;
            createdAt: Date;
            updatedAt: Date;
            replyTo: {
                id: string;
                kind: "QUESTION" | "TRACKING" | "REPLY" | "NOTIFICATION";
                body?: string | null;
                payload: {
                    entryDate?: string;
                    sections?: {
                        alimentacion?: string;
                        suplementos?: string;
                        actividadFisica?: string;
                    };
                    source?: "patient" | "nutritionist";
                    notificationTitle?: string;
                    notificationType?: "INFO" | "REMINDER" | "ALERT";
                };
                replyToId?: string | null;
                createdAt: Date;
                updatedAt: Date;
            } | null;
            replies: Array<{
                id: string;
                kind: "QUESTION" | "TRACKING" | "REPLY" | "NOTIFICATION";
                body?: string | null;
                payload: {
                    entryDate?: string;
                    sections?: {
                        alimentacion?: string;
                        suplementos?: string;
                        actividadFisica?: string;
                    };
                    source?: "patient" | "nutritionist";
                    notificationTitle?: string;
                    notificationType?: "INFO" | "REMINDER" | "ALERT";
                };
                replyToId?: string | null;
                createdAt: Date;
                updatedAt: Date;
            }>;
        }[];
        tracking: {
            id: string;
            kind: "QUESTION" | "TRACKING" | "REPLY" | "NOTIFICATION";
            body?: string | null;
            payload: {
                entryDate?: string;
                sections?: {
                    alimentacion?: string;
                    suplementos?: string;
                    actividadFisica?: string;
                };
                source?: "patient" | "nutritionist";
                notificationTitle?: string;
                notificationType?: "INFO" | "REMINDER" | "ALERT";
            };
            replyToId?: string | null;
            createdAt: Date;
            updatedAt: Date;
            replyTo: {
                id: string;
                kind: "QUESTION" | "TRACKING" | "REPLY" | "NOTIFICATION";
                body?: string | null;
                payload: {
                    entryDate?: string;
                    sections?: {
                        alimentacion?: string;
                        suplementos?: string;
                        actividadFisica?: string;
                    };
                    source?: "patient" | "nutritionist";
                    notificationTitle?: string;
                    notificationType?: "INFO" | "REMINDER" | "ALERT";
                };
                replyToId?: string | null;
                createdAt: Date;
                updatedAt: Date;
            } | null;
            replies: Array<{
                id: string;
                kind: "QUESTION" | "TRACKING" | "REPLY" | "NOTIFICATION";
                body?: string | null;
                payload: {
                    entryDate?: string;
                    sections?: {
                        alimentacion?: string;
                        suplementos?: string;
                        actividadFisica?: string;
                    };
                    source?: "patient" | "nutritionist";
                    notificationTitle?: string;
                    notificationType?: "INFO" | "REMINDER" | "ALERT";
                };
                replyToId?: string | null;
                createdAt: Date;
                updatedAt: Date;
            }>;
        }[];
        replies: {
            id: string;
            kind: "QUESTION" | "TRACKING" | "REPLY" | "NOTIFICATION";
            body?: string | null;
            payload: {
                entryDate?: string;
                sections?: {
                    alimentacion?: string;
                    suplementos?: string;
                    actividadFisica?: string;
                };
                source?: "patient" | "nutritionist";
                notificationTitle?: string;
                notificationType?: "INFO" | "REMINDER" | "ALERT";
            };
            replyToId?: string | null;
            createdAt: Date;
            updatedAt: Date;
            replyTo: {
                id: string;
                kind: "QUESTION" | "TRACKING" | "REPLY" | "NOTIFICATION";
                body?: string | null;
                payload: {
                    entryDate?: string;
                    sections?: {
                        alimentacion?: string;
                        suplementos?: string;
                        actividadFisica?: string;
                    };
                    source?: "patient" | "nutritionist";
                    notificationTitle?: string;
                    notificationType?: "INFO" | "REMINDER" | "ALERT";
                };
                replyToId?: string | null;
                createdAt: Date;
                updatedAt: Date;
            } | null;
            replies: Array<{
                id: string;
                kind: "QUESTION" | "TRACKING" | "REPLY" | "NOTIFICATION";
                body?: string | null;
                payload: {
                    entryDate?: string;
                    sections?: {
                        alimentacion?: string;
                        suplementos?: string;
                        actividadFisica?: string;
                    };
                    source?: "patient" | "nutritionist";
                    notificationTitle?: string;
                    notificationType?: "INFO" | "REMINDER" | "ALERT";
                };
                replyToId?: string | null;
                createdAt: Date;
                updatedAt: Date;
            }>;
        }[];
        notifications: {
            id: string;
            kind: "QUESTION" | "TRACKING" | "REPLY" | "NOTIFICATION";
            body?: string | null;
            payload: {
                entryDate?: string;
                sections?: {
                    alimentacion?: string;
                    suplementos?: string;
                    actividadFisica?: string;
                };
                source?: "patient" | "nutritionist";
                notificationTitle?: string;
                notificationType?: "INFO" | "REMINDER" | "ALERT";
            };
            replyToId?: string | null;
            createdAt: Date;
            updatedAt: Date;
            replyTo: {
                id: string;
                kind: "QUESTION" | "TRACKING" | "REPLY" | "NOTIFICATION";
                body?: string | null;
                payload: {
                    entryDate?: string;
                    sections?: {
                        alimentacion?: string;
                        suplementos?: string;
                        actividadFisica?: string;
                    };
                    source?: "patient" | "nutritionist";
                    notificationTitle?: string;
                    notificationType?: "INFO" | "REMINDER" | "ALERT";
                };
                replyToId?: string | null;
                createdAt: Date;
                updatedAt: Date;
            } | null;
            replies: Array<{
                id: string;
                kind: "QUESTION" | "TRACKING" | "REPLY" | "NOTIFICATION";
                body?: string | null;
                payload: {
                    entryDate?: string;
                    sections?: {
                        alimentacion?: string;
                        suplementos?: string;
                        actividadFisica?: string;
                    };
                    source?: "patient" | "nutritionist";
                    notificationTitle?: string;
                    notificationType?: "INFO" | "REMINDER" | "ALERT";
                };
                replyToId?: string | null;
                createdAt: Date;
                updatedAt: Date;
            }>;
        }[];
        sharedResources: {
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
        }[];
        sharedDeliverables: {
            id: string;
            name: string;
            type: string;
            format: string;
            content: unknown;
            metadata: unknown;
            tags: string[];
            createdAt: Date;
            updatedAt: Date;
        }[];
    }>;
    createQuestion(req: any, dto: CreatePatientPortalQuestionDto): Promise<{
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
                projects: {
                    id: string;
                    name: string;
                    mode: string;
                    status: string;
                    updatedAt: Date;
                    description: string | null;
                    activeDeliverableCreation: {
                        id: string;
                        name: string;
                        type: string;
                    } | null;
                    activeDietCreation: {
                        id: string;
                        name: string;
                        type: string;
                    } | null;
                    activeRecipeCreation: {
                        id: string;
                        name: string;
                        type: string;
                    } | null;
                }[];
                documentId: string | null;
                height: number | null;
                weight: number | null;
            };
            portal: {
                activeInvitation: {
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
                } | null;
                latestInvitation: {
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
                } | null;
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
            entries: {
                id: string;
                kind: "QUESTION" | "TRACKING" | "REPLY" | "NOTIFICATION";
                body?: string | null;
                payload: {
                    entryDate?: string;
                    sections?: {
                        alimentacion?: string;
                        suplementos?: string;
                        actividadFisica?: string;
                    };
                    source?: "patient" | "nutritionist";
                    notificationTitle?: string;
                    notificationType?: "INFO" | "REMINDER" | "ALERT";
                };
                replyToId?: string | null;
                createdAt: Date;
                updatedAt: Date;
                replyTo: {
                    id: string;
                    kind: "QUESTION" | "TRACKING" | "REPLY" | "NOTIFICATION";
                    body?: string | null;
                    payload: {
                        entryDate?: string;
                        sections?: {
                            alimentacion?: string;
                            suplementos?: string;
                            actividadFisica?: string;
                        };
                        source?: "patient" | "nutritionist";
                        notificationTitle?: string;
                        notificationType?: "INFO" | "REMINDER" | "ALERT";
                    };
                    replyToId?: string | null;
                    createdAt: Date;
                    updatedAt: Date;
                } | null;
                replies: Array<{
                    id: string;
                    kind: "QUESTION" | "TRACKING" | "REPLY" | "NOTIFICATION";
                    body?: string | null;
                    payload: {
                        entryDate?: string;
                        sections?: {
                            alimentacion?: string;
                            suplementos?: string;
                            actividadFisica?: string;
                        };
                        source?: "patient" | "nutritionist";
                        notificationTitle?: string;
                        notificationType?: "INFO" | "REMINDER" | "ALERT";
                    };
                    replyToId?: string | null;
                    createdAt: Date;
                    updatedAt: Date;
                }>;
            }[];
            questions: {
                id: string;
                kind: "QUESTION" | "TRACKING" | "REPLY" | "NOTIFICATION";
                body?: string | null;
                payload: {
                    entryDate?: string;
                    sections?: {
                        alimentacion?: string;
                        suplementos?: string;
                        actividadFisica?: string;
                    };
                    source?: "patient" | "nutritionist";
                    notificationTitle?: string;
                    notificationType?: "INFO" | "REMINDER" | "ALERT";
                };
                replyToId?: string | null;
                createdAt: Date;
                updatedAt: Date;
                replyTo: {
                    id: string;
                    kind: "QUESTION" | "TRACKING" | "REPLY" | "NOTIFICATION";
                    body?: string | null;
                    payload: {
                        entryDate?: string;
                        sections?: {
                            alimentacion?: string;
                            suplementos?: string;
                            actividadFisica?: string;
                        };
                        source?: "patient" | "nutritionist";
                        notificationTitle?: string;
                        notificationType?: "INFO" | "REMINDER" | "ALERT";
                    };
                    replyToId?: string | null;
                    createdAt: Date;
                    updatedAt: Date;
                } | null;
                replies: Array<{
                    id: string;
                    kind: "QUESTION" | "TRACKING" | "REPLY" | "NOTIFICATION";
                    body?: string | null;
                    payload: {
                        entryDate?: string;
                        sections?: {
                            alimentacion?: string;
                            suplementos?: string;
                            actividadFisica?: string;
                        };
                        source?: "patient" | "nutritionist";
                        notificationTitle?: string;
                        notificationType?: "INFO" | "REMINDER" | "ALERT";
                    };
                    replyToId?: string | null;
                    createdAt: Date;
                    updatedAt: Date;
                }>;
            }[];
            tracking: {
                id: string;
                kind: "QUESTION" | "TRACKING" | "REPLY" | "NOTIFICATION";
                body?: string | null;
                payload: {
                    entryDate?: string;
                    sections?: {
                        alimentacion?: string;
                        suplementos?: string;
                        actividadFisica?: string;
                    };
                    source?: "patient" | "nutritionist";
                    notificationTitle?: string;
                    notificationType?: "INFO" | "REMINDER" | "ALERT";
                };
                replyToId?: string | null;
                createdAt: Date;
                updatedAt: Date;
                replyTo: {
                    id: string;
                    kind: "QUESTION" | "TRACKING" | "REPLY" | "NOTIFICATION";
                    body?: string | null;
                    payload: {
                        entryDate?: string;
                        sections?: {
                            alimentacion?: string;
                            suplementos?: string;
                            actividadFisica?: string;
                        };
                        source?: "patient" | "nutritionist";
                        notificationTitle?: string;
                        notificationType?: "INFO" | "REMINDER" | "ALERT";
                    };
                    replyToId?: string | null;
                    createdAt: Date;
                    updatedAt: Date;
                } | null;
                replies: Array<{
                    id: string;
                    kind: "QUESTION" | "TRACKING" | "REPLY" | "NOTIFICATION";
                    body?: string | null;
                    payload: {
                        entryDate?: string;
                        sections?: {
                            alimentacion?: string;
                            suplementos?: string;
                            actividadFisica?: string;
                        };
                        source?: "patient" | "nutritionist";
                        notificationTitle?: string;
                        notificationType?: "INFO" | "REMINDER" | "ALERT";
                    };
                    replyToId?: string | null;
                    createdAt: Date;
                    updatedAt: Date;
                }>;
            }[];
            replies: {
                id: string;
                kind: "QUESTION" | "TRACKING" | "REPLY" | "NOTIFICATION";
                body?: string | null;
                payload: {
                    entryDate?: string;
                    sections?: {
                        alimentacion?: string;
                        suplementos?: string;
                        actividadFisica?: string;
                    };
                    source?: "patient" | "nutritionist";
                    notificationTitle?: string;
                    notificationType?: "INFO" | "REMINDER" | "ALERT";
                };
                replyToId?: string | null;
                createdAt: Date;
                updatedAt: Date;
                replyTo: {
                    id: string;
                    kind: "QUESTION" | "TRACKING" | "REPLY" | "NOTIFICATION";
                    body?: string | null;
                    payload: {
                        entryDate?: string;
                        sections?: {
                            alimentacion?: string;
                            suplementos?: string;
                            actividadFisica?: string;
                        };
                        source?: "patient" | "nutritionist";
                        notificationTitle?: string;
                        notificationType?: "INFO" | "REMINDER" | "ALERT";
                    };
                    replyToId?: string | null;
                    createdAt: Date;
                    updatedAt: Date;
                } | null;
                replies: Array<{
                    id: string;
                    kind: "QUESTION" | "TRACKING" | "REPLY" | "NOTIFICATION";
                    body?: string | null;
                    payload: {
                        entryDate?: string;
                        sections?: {
                            alimentacion?: string;
                            suplementos?: string;
                            actividadFisica?: string;
                        };
                        source?: "patient" | "nutritionist";
                        notificationTitle?: string;
                        notificationType?: "INFO" | "REMINDER" | "ALERT";
                    };
                    replyToId?: string | null;
                    createdAt: Date;
                    updatedAt: Date;
                }>;
            }[];
            notifications: {
                id: string;
                kind: "QUESTION" | "TRACKING" | "REPLY" | "NOTIFICATION";
                body?: string | null;
                payload: {
                    entryDate?: string;
                    sections?: {
                        alimentacion?: string;
                        suplementos?: string;
                        actividadFisica?: string;
                    };
                    source?: "patient" | "nutritionist";
                    notificationTitle?: string;
                    notificationType?: "INFO" | "REMINDER" | "ALERT";
                };
                replyToId?: string | null;
                createdAt: Date;
                updatedAt: Date;
                replyTo: {
                    id: string;
                    kind: "QUESTION" | "TRACKING" | "REPLY" | "NOTIFICATION";
                    body?: string | null;
                    payload: {
                        entryDate?: string;
                        sections?: {
                            alimentacion?: string;
                            suplementos?: string;
                            actividadFisica?: string;
                        };
                        source?: "patient" | "nutritionist";
                        notificationTitle?: string;
                        notificationType?: "INFO" | "REMINDER" | "ALERT";
                    };
                    replyToId?: string | null;
                    createdAt: Date;
                    updatedAt: Date;
                } | null;
                replies: Array<{
                    id: string;
                    kind: "QUESTION" | "TRACKING" | "REPLY" | "NOTIFICATION";
                    body?: string | null;
                    payload: {
                        entryDate?: string;
                        sections?: {
                            alimentacion?: string;
                            suplementos?: string;
                            actividadFisica?: string;
                        };
                        source?: "patient" | "nutritionist";
                        notificationTitle?: string;
                        notificationType?: "INFO" | "REMINDER" | "ALERT";
                    };
                    replyToId?: string | null;
                    createdAt: Date;
                    updatedAt: Date;
                }>;
            }[];
            sharedResources: {
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
            }[];
            sharedDeliverables: {
                id: string;
                name: string;
                type: string;
                format: string;
                content: unknown;
                metadata: unknown;
                tags: string[];
                createdAt: Date;
                updatedAt: Date;
            }[];
        };
    }>;
    createTracking(req: any, dto: CreatePatientPortalEntryDto): Promise<{
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
                projects: {
                    id: string;
                    name: string;
                    mode: string;
                    status: string;
                    updatedAt: Date;
                    description: string | null;
                    activeDeliverableCreation: {
                        id: string;
                        name: string;
                        type: string;
                    } | null;
                    activeDietCreation: {
                        id: string;
                        name: string;
                        type: string;
                    } | null;
                    activeRecipeCreation: {
                        id: string;
                        name: string;
                        type: string;
                    } | null;
                }[];
                documentId: string | null;
                height: number | null;
                weight: number | null;
            };
            portal: {
                activeInvitation: {
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
                } | null;
                latestInvitation: {
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
                } | null;
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
            entries: {
                id: string;
                kind: "QUESTION" | "TRACKING" | "REPLY" | "NOTIFICATION";
                body?: string | null;
                payload: {
                    entryDate?: string;
                    sections?: {
                        alimentacion?: string;
                        suplementos?: string;
                        actividadFisica?: string;
                    };
                    source?: "patient" | "nutritionist";
                    notificationTitle?: string;
                    notificationType?: "INFO" | "REMINDER" | "ALERT";
                };
                replyToId?: string | null;
                createdAt: Date;
                updatedAt: Date;
                replyTo: {
                    id: string;
                    kind: "QUESTION" | "TRACKING" | "REPLY" | "NOTIFICATION";
                    body?: string | null;
                    payload: {
                        entryDate?: string;
                        sections?: {
                            alimentacion?: string;
                            suplementos?: string;
                            actividadFisica?: string;
                        };
                        source?: "patient" | "nutritionist";
                        notificationTitle?: string;
                        notificationType?: "INFO" | "REMINDER" | "ALERT";
                    };
                    replyToId?: string | null;
                    createdAt: Date;
                    updatedAt: Date;
                } | null;
                replies: Array<{
                    id: string;
                    kind: "QUESTION" | "TRACKING" | "REPLY" | "NOTIFICATION";
                    body?: string | null;
                    payload: {
                        entryDate?: string;
                        sections?: {
                            alimentacion?: string;
                            suplementos?: string;
                            actividadFisica?: string;
                        };
                        source?: "patient" | "nutritionist";
                        notificationTitle?: string;
                        notificationType?: "INFO" | "REMINDER" | "ALERT";
                    };
                    replyToId?: string | null;
                    createdAt: Date;
                    updatedAt: Date;
                }>;
            }[];
            questions: {
                id: string;
                kind: "QUESTION" | "TRACKING" | "REPLY" | "NOTIFICATION";
                body?: string | null;
                payload: {
                    entryDate?: string;
                    sections?: {
                        alimentacion?: string;
                        suplementos?: string;
                        actividadFisica?: string;
                    };
                    source?: "patient" | "nutritionist";
                    notificationTitle?: string;
                    notificationType?: "INFO" | "REMINDER" | "ALERT";
                };
                replyToId?: string | null;
                createdAt: Date;
                updatedAt: Date;
                replyTo: {
                    id: string;
                    kind: "QUESTION" | "TRACKING" | "REPLY" | "NOTIFICATION";
                    body?: string | null;
                    payload: {
                        entryDate?: string;
                        sections?: {
                            alimentacion?: string;
                            suplementos?: string;
                            actividadFisica?: string;
                        };
                        source?: "patient" | "nutritionist";
                        notificationTitle?: string;
                        notificationType?: "INFO" | "REMINDER" | "ALERT";
                    };
                    replyToId?: string | null;
                    createdAt: Date;
                    updatedAt: Date;
                } | null;
                replies: Array<{
                    id: string;
                    kind: "QUESTION" | "TRACKING" | "REPLY" | "NOTIFICATION";
                    body?: string | null;
                    payload: {
                        entryDate?: string;
                        sections?: {
                            alimentacion?: string;
                            suplementos?: string;
                            actividadFisica?: string;
                        };
                        source?: "patient" | "nutritionist";
                        notificationTitle?: string;
                        notificationType?: "INFO" | "REMINDER" | "ALERT";
                    };
                    replyToId?: string | null;
                    createdAt: Date;
                    updatedAt: Date;
                }>;
            }[];
            tracking: {
                id: string;
                kind: "QUESTION" | "TRACKING" | "REPLY" | "NOTIFICATION";
                body?: string | null;
                payload: {
                    entryDate?: string;
                    sections?: {
                        alimentacion?: string;
                        suplementos?: string;
                        actividadFisica?: string;
                    };
                    source?: "patient" | "nutritionist";
                    notificationTitle?: string;
                    notificationType?: "INFO" | "REMINDER" | "ALERT";
                };
                replyToId?: string | null;
                createdAt: Date;
                updatedAt: Date;
                replyTo: {
                    id: string;
                    kind: "QUESTION" | "TRACKING" | "REPLY" | "NOTIFICATION";
                    body?: string | null;
                    payload: {
                        entryDate?: string;
                        sections?: {
                            alimentacion?: string;
                            suplementos?: string;
                            actividadFisica?: string;
                        };
                        source?: "patient" | "nutritionist";
                        notificationTitle?: string;
                        notificationType?: "INFO" | "REMINDER" | "ALERT";
                    };
                    replyToId?: string | null;
                    createdAt: Date;
                    updatedAt: Date;
                } | null;
                replies: Array<{
                    id: string;
                    kind: "QUESTION" | "TRACKING" | "REPLY" | "NOTIFICATION";
                    body?: string | null;
                    payload: {
                        entryDate?: string;
                        sections?: {
                            alimentacion?: string;
                            suplementos?: string;
                            actividadFisica?: string;
                        };
                        source?: "patient" | "nutritionist";
                        notificationTitle?: string;
                        notificationType?: "INFO" | "REMINDER" | "ALERT";
                    };
                    replyToId?: string | null;
                    createdAt: Date;
                    updatedAt: Date;
                }>;
            }[];
            replies: {
                id: string;
                kind: "QUESTION" | "TRACKING" | "REPLY" | "NOTIFICATION";
                body?: string | null;
                payload: {
                    entryDate?: string;
                    sections?: {
                        alimentacion?: string;
                        suplementos?: string;
                        actividadFisica?: string;
                    };
                    source?: "patient" | "nutritionist";
                    notificationTitle?: string;
                    notificationType?: "INFO" | "REMINDER" | "ALERT";
                };
                replyToId?: string | null;
                createdAt: Date;
                updatedAt: Date;
                replyTo: {
                    id: string;
                    kind: "QUESTION" | "TRACKING" | "REPLY" | "NOTIFICATION";
                    body?: string | null;
                    payload: {
                        entryDate?: string;
                        sections?: {
                            alimentacion?: string;
                            suplementos?: string;
                            actividadFisica?: string;
                        };
                        source?: "patient" | "nutritionist";
                        notificationTitle?: string;
                        notificationType?: "INFO" | "REMINDER" | "ALERT";
                    };
                    replyToId?: string | null;
                    createdAt: Date;
                    updatedAt: Date;
                } | null;
                replies: Array<{
                    id: string;
                    kind: "QUESTION" | "TRACKING" | "REPLY" | "NOTIFICATION";
                    body?: string | null;
                    payload: {
                        entryDate?: string;
                        sections?: {
                            alimentacion?: string;
                            suplementos?: string;
                            actividadFisica?: string;
                        };
                        source?: "patient" | "nutritionist";
                        notificationTitle?: string;
                        notificationType?: "INFO" | "REMINDER" | "ALERT";
                    };
                    replyToId?: string | null;
                    createdAt: Date;
                    updatedAt: Date;
                }>;
            }[];
            notifications: {
                id: string;
                kind: "QUESTION" | "TRACKING" | "REPLY" | "NOTIFICATION";
                body?: string | null;
                payload: {
                    entryDate?: string;
                    sections?: {
                        alimentacion?: string;
                        suplementos?: string;
                        actividadFisica?: string;
                    };
                    source?: "patient" | "nutritionist";
                    notificationTitle?: string;
                    notificationType?: "INFO" | "REMINDER" | "ALERT";
                };
                replyToId?: string | null;
                createdAt: Date;
                updatedAt: Date;
                replyTo: {
                    id: string;
                    kind: "QUESTION" | "TRACKING" | "REPLY" | "NOTIFICATION";
                    body?: string | null;
                    payload: {
                        entryDate?: string;
                        sections?: {
                            alimentacion?: string;
                            suplementos?: string;
                            actividadFisica?: string;
                        };
                        source?: "patient" | "nutritionist";
                        notificationTitle?: string;
                        notificationType?: "INFO" | "REMINDER" | "ALERT";
                    };
                    replyToId?: string | null;
                    createdAt: Date;
                    updatedAt: Date;
                } | null;
                replies: Array<{
                    id: string;
                    kind: "QUESTION" | "TRACKING" | "REPLY" | "NOTIFICATION";
                    body?: string | null;
                    payload: {
                        entryDate?: string;
                        sections?: {
                            alimentacion?: string;
                            suplementos?: string;
                            actividadFisica?: string;
                        };
                        source?: "patient" | "nutritionist";
                        notificationTitle?: string;
                        notificationType?: "INFO" | "REMINDER" | "ALERT";
                    };
                    replyToId?: string | null;
                    createdAt: Date;
                    updatedAt: Date;
                }>;
            }[];
            sharedResources: {
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
            }[];
            sharedDeliverables: {
                id: string;
                name: string;
                type: string;
                format: string;
                content: unknown;
                metadata: unknown;
                tags: string[];
                createdAt: Date;
                updatedAt: Date;
            }[];
        };
    }>;
    createJournal(req: any, dto: CreatePatientPortalEntryDto): Promise<{
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
                projects: {
                    id: string;
                    name: string;
                    mode: string;
                    status: string;
                    updatedAt: Date;
                    description: string | null;
                    activeDeliverableCreation: {
                        id: string;
                        name: string;
                        type: string;
                    } | null;
                    activeDietCreation: {
                        id: string;
                        name: string;
                        type: string;
                    } | null;
                    activeRecipeCreation: {
                        id: string;
                        name: string;
                        type: string;
                    } | null;
                }[];
                documentId: string | null;
                height: number | null;
                weight: number | null;
            };
            portal: {
                activeInvitation: {
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
                } | null;
                latestInvitation: {
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
                } | null;
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
            entries: {
                id: string;
                kind: "QUESTION" | "TRACKING" | "REPLY" | "NOTIFICATION";
                body?: string | null;
                payload: {
                    entryDate?: string;
                    sections?: {
                        alimentacion?: string;
                        suplementos?: string;
                        actividadFisica?: string;
                    };
                    source?: "patient" | "nutritionist";
                    notificationTitle?: string;
                    notificationType?: "INFO" | "REMINDER" | "ALERT";
                };
                replyToId?: string | null;
                createdAt: Date;
                updatedAt: Date;
                replyTo: {
                    id: string;
                    kind: "QUESTION" | "TRACKING" | "REPLY" | "NOTIFICATION";
                    body?: string | null;
                    payload: {
                        entryDate?: string;
                        sections?: {
                            alimentacion?: string;
                            suplementos?: string;
                            actividadFisica?: string;
                        };
                        source?: "patient" | "nutritionist";
                        notificationTitle?: string;
                        notificationType?: "INFO" | "REMINDER" | "ALERT";
                    };
                    replyToId?: string | null;
                    createdAt: Date;
                    updatedAt: Date;
                } | null;
                replies: Array<{
                    id: string;
                    kind: "QUESTION" | "TRACKING" | "REPLY" | "NOTIFICATION";
                    body?: string | null;
                    payload: {
                        entryDate?: string;
                        sections?: {
                            alimentacion?: string;
                            suplementos?: string;
                            actividadFisica?: string;
                        };
                        source?: "patient" | "nutritionist";
                        notificationTitle?: string;
                        notificationType?: "INFO" | "REMINDER" | "ALERT";
                    };
                    replyToId?: string | null;
                    createdAt: Date;
                    updatedAt: Date;
                }>;
            }[];
            questions: {
                id: string;
                kind: "QUESTION" | "TRACKING" | "REPLY" | "NOTIFICATION";
                body?: string | null;
                payload: {
                    entryDate?: string;
                    sections?: {
                        alimentacion?: string;
                        suplementos?: string;
                        actividadFisica?: string;
                    };
                    source?: "patient" | "nutritionist";
                    notificationTitle?: string;
                    notificationType?: "INFO" | "REMINDER" | "ALERT";
                };
                replyToId?: string | null;
                createdAt: Date;
                updatedAt: Date;
                replyTo: {
                    id: string;
                    kind: "QUESTION" | "TRACKING" | "REPLY" | "NOTIFICATION";
                    body?: string | null;
                    payload: {
                        entryDate?: string;
                        sections?: {
                            alimentacion?: string;
                            suplementos?: string;
                            actividadFisica?: string;
                        };
                        source?: "patient" | "nutritionist";
                        notificationTitle?: string;
                        notificationType?: "INFO" | "REMINDER" | "ALERT";
                    };
                    replyToId?: string | null;
                    createdAt: Date;
                    updatedAt: Date;
                } | null;
                replies: Array<{
                    id: string;
                    kind: "QUESTION" | "TRACKING" | "REPLY" | "NOTIFICATION";
                    body?: string | null;
                    payload: {
                        entryDate?: string;
                        sections?: {
                            alimentacion?: string;
                            suplementos?: string;
                            actividadFisica?: string;
                        };
                        source?: "patient" | "nutritionist";
                        notificationTitle?: string;
                        notificationType?: "INFO" | "REMINDER" | "ALERT";
                    };
                    replyToId?: string | null;
                    createdAt: Date;
                    updatedAt: Date;
                }>;
            }[];
            tracking: {
                id: string;
                kind: "QUESTION" | "TRACKING" | "REPLY" | "NOTIFICATION";
                body?: string | null;
                payload: {
                    entryDate?: string;
                    sections?: {
                        alimentacion?: string;
                        suplementos?: string;
                        actividadFisica?: string;
                    };
                    source?: "patient" | "nutritionist";
                    notificationTitle?: string;
                    notificationType?: "INFO" | "REMINDER" | "ALERT";
                };
                replyToId?: string | null;
                createdAt: Date;
                updatedAt: Date;
                replyTo: {
                    id: string;
                    kind: "QUESTION" | "TRACKING" | "REPLY" | "NOTIFICATION";
                    body?: string | null;
                    payload: {
                        entryDate?: string;
                        sections?: {
                            alimentacion?: string;
                            suplementos?: string;
                            actividadFisica?: string;
                        };
                        source?: "patient" | "nutritionist";
                        notificationTitle?: string;
                        notificationType?: "INFO" | "REMINDER" | "ALERT";
                    };
                    replyToId?: string | null;
                    createdAt: Date;
                    updatedAt: Date;
                } | null;
                replies: Array<{
                    id: string;
                    kind: "QUESTION" | "TRACKING" | "REPLY" | "NOTIFICATION";
                    body?: string | null;
                    payload: {
                        entryDate?: string;
                        sections?: {
                            alimentacion?: string;
                            suplementos?: string;
                            actividadFisica?: string;
                        };
                        source?: "patient" | "nutritionist";
                        notificationTitle?: string;
                        notificationType?: "INFO" | "REMINDER" | "ALERT";
                    };
                    replyToId?: string | null;
                    createdAt: Date;
                    updatedAt: Date;
                }>;
            }[];
            replies: {
                id: string;
                kind: "QUESTION" | "TRACKING" | "REPLY" | "NOTIFICATION";
                body?: string | null;
                payload: {
                    entryDate?: string;
                    sections?: {
                        alimentacion?: string;
                        suplementos?: string;
                        actividadFisica?: string;
                    };
                    source?: "patient" | "nutritionist";
                    notificationTitle?: string;
                    notificationType?: "INFO" | "REMINDER" | "ALERT";
                };
                replyToId?: string | null;
                createdAt: Date;
                updatedAt: Date;
                replyTo: {
                    id: string;
                    kind: "QUESTION" | "TRACKING" | "REPLY" | "NOTIFICATION";
                    body?: string | null;
                    payload: {
                        entryDate?: string;
                        sections?: {
                            alimentacion?: string;
                            suplementos?: string;
                            actividadFisica?: string;
                        };
                        source?: "patient" | "nutritionist";
                        notificationTitle?: string;
                        notificationType?: "INFO" | "REMINDER" | "ALERT";
                    };
                    replyToId?: string | null;
                    createdAt: Date;
                    updatedAt: Date;
                } | null;
                replies: Array<{
                    id: string;
                    kind: "QUESTION" | "TRACKING" | "REPLY" | "NOTIFICATION";
                    body?: string | null;
                    payload: {
                        entryDate?: string;
                        sections?: {
                            alimentacion?: string;
                            suplementos?: string;
                            actividadFisica?: string;
                        };
                        source?: "patient" | "nutritionist";
                        notificationTitle?: string;
                        notificationType?: "INFO" | "REMINDER" | "ALERT";
                    };
                    replyToId?: string | null;
                    createdAt: Date;
                    updatedAt: Date;
                }>;
            }[];
            notifications: {
                id: string;
                kind: "QUESTION" | "TRACKING" | "REPLY" | "NOTIFICATION";
                body?: string | null;
                payload: {
                    entryDate?: string;
                    sections?: {
                        alimentacion?: string;
                        suplementos?: string;
                        actividadFisica?: string;
                    };
                    source?: "patient" | "nutritionist";
                    notificationTitle?: string;
                    notificationType?: "INFO" | "REMINDER" | "ALERT";
                };
                replyToId?: string | null;
                createdAt: Date;
                updatedAt: Date;
                replyTo: {
                    id: string;
                    kind: "QUESTION" | "TRACKING" | "REPLY" | "NOTIFICATION";
                    body?: string | null;
                    payload: {
                        entryDate?: string;
                        sections?: {
                            alimentacion?: string;
                            suplementos?: string;
                            actividadFisica?: string;
                        };
                        source?: "patient" | "nutritionist";
                        notificationTitle?: string;
                        notificationType?: "INFO" | "REMINDER" | "ALERT";
                    };
                    replyToId?: string | null;
                    createdAt: Date;
                    updatedAt: Date;
                } | null;
                replies: Array<{
                    id: string;
                    kind: "QUESTION" | "TRACKING" | "REPLY" | "NOTIFICATION";
                    body?: string | null;
                    payload: {
                        entryDate?: string;
                        sections?: {
                            alimentacion?: string;
                            suplementos?: string;
                            actividadFisica?: string;
                        };
                        source?: "patient" | "nutritionist";
                        notificationTitle?: string;
                        notificationType?: "INFO" | "REMINDER" | "ALERT";
                    };
                    replyToId?: string | null;
                    createdAt: Date;
                    updatedAt: Date;
                }>;
            }[];
            sharedResources: {
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
            }[];
            sharedDeliverables: {
                id: string;
                name: string;
                type: string;
                format: string;
                content: unknown;
                metadata: unknown;
                tags: string[];
                createdAt: Date;
                updatedAt: Date;
            }[];
        };
    }>;
    createTrackingAlias(req: any, dto: CreatePatientPortalEntryDto): Promise<{
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
                projects: {
                    id: string;
                    name: string;
                    mode: string;
                    status: string;
                    updatedAt: Date;
                    description: string | null;
                    activeDeliverableCreation: {
                        id: string;
                        name: string;
                        type: string;
                    } | null;
                    activeDietCreation: {
                        id: string;
                        name: string;
                        type: string;
                    } | null;
                    activeRecipeCreation: {
                        id: string;
                        name: string;
                        type: string;
                    } | null;
                }[];
                documentId: string | null;
                height: number | null;
                weight: number | null;
            };
            portal: {
                activeInvitation: {
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
                } | null;
                latestInvitation: {
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
                } | null;
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
            entries: {
                id: string;
                kind: "QUESTION" | "TRACKING" | "REPLY" | "NOTIFICATION";
                body?: string | null;
                payload: {
                    entryDate?: string;
                    sections?: {
                        alimentacion?: string;
                        suplementos?: string;
                        actividadFisica?: string;
                    };
                    source?: "patient" | "nutritionist";
                    notificationTitle?: string;
                    notificationType?: "INFO" | "REMINDER" | "ALERT";
                };
                replyToId?: string | null;
                createdAt: Date;
                updatedAt: Date;
                replyTo: {
                    id: string;
                    kind: "QUESTION" | "TRACKING" | "REPLY" | "NOTIFICATION";
                    body?: string | null;
                    payload: {
                        entryDate?: string;
                        sections?: {
                            alimentacion?: string;
                            suplementos?: string;
                            actividadFisica?: string;
                        };
                        source?: "patient" | "nutritionist";
                        notificationTitle?: string;
                        notificationType?: "INFO" | "REMINDER" | "ALERT";
                    };
                    replyToId?: string | null;
                    createdAt: Date;
                    updatedAt: Date;
                } | null;
                replies: Array<{
                    id: string;
                    kind: "QUESTION" | "TRACKING" | "REPLY" | "NOTIFICATION";
                    body?: string | null;
                    payload: {
                        entryDate?: string;
                        sections?: {
                            alimentacion?: string;
                            suplementos?: string;
                            actividadFisica?: string;
                        };
                        source?: "patient" | "nutritionist";
                        notificationTitle?: string;
                        notificationType?: "INFO" | "REMINDER" | "ALERT";
                    };
                    replyToId?: string | null;
                    createdAt: Date;
                    updatedAt: Date;
                }>;
            }[];
            questions: {
                id: string;
                kind: "QUESTION" | "TRACKING" | "REPLY" | "NOTIFICATION";
                body?: string | null;
                payload: {
                    entryDate?: string;
                    sections?: {
                        alimentacion?: string;
                        suplementos?: string;
                        actividadFisica?: string;
                    };
                    source?: "patient" | "nutritionist";
                    notificationTitle?: string;
                    notificationType?: "INFO" | "REMINDER" | "ALERT";
                };
                replyToId?: string | null;
                createdAt: Date;
                updatedAt: Date;
                replyTo: {
                    id: string;
                    kind: "QUESTION" | "TRACKING" | "REPLY" | "NOTIFICATION";
                    body?: string | null;
                    payload: {
                        entryDate?: string;
                        sections?: {
                            alimentacion?: string;
                            suplementos?: string;
                            actividadFisica?: string;
                        };
                        source?: "patient" | "nutritionist";
                        notificationTitle?: string;
                        notificationType?: "INFO" | "REMINDER" | "ALERT";
                    };
                    replyToId?: string | null;
                    createdAt: Date;
                    updatedAt: Date;
                } | null;
                replies: Array<{
                    id: string;
                    kind: "QUESTION" | "TRACKING" | "REPLY" | "NOTIFICATION";
                    body?: string | null;
                    payload: {
                        entryDate?: string;
                        sections?: {
                            alimentacion?: string;
                            suplementos?: string;
                            actividadFisica?: string;
                        };
                        source?: "patient" | "nutritionist";
                        notificationTitle?: string;
                        notificationType?: "INFO" | "REMINDER" | "ALERT";
                    };
                    replyToId?: string | null;
                    createdAt: Date;
                    updatedAt: Date;
                }>;
            }[];
            tracking: {
                id: string;
                kind: "QUESTION" | "TRACKING" | "REPLY" | "NOTIFICATION";
                body?: string | null;
                payload: {
                    entryDate?: string;
                    sections?: {
                        alimentacion?: string;
                        suplementos?: string;
                        actividadFisica?: string;
                    };
                    source?: "patient" | "nutritionist";
                    notificationTitle?: string;
                    notificationType?: "INFO" | "REMINDER" | "ALERT";
                };
                replyToId?: string | null;
                createdAt: Date;
                updatedAt: Date;
                replyTo: {
                    id: string;
                    kind: "QUESTION" | "TRACKING" | "REPLY" | "NOTIFICATION";
                    body?: string | null;
                    payload: {
                        entryDate?: string;
                        sections?: {
                            alimentacion?: string;
                            suplementos?: string;
                            actividadFisica?: string;
                        };
                        source?: "patient" | "nutritionist";
                        notificationTitle?: string;
                        notificationType?: "INFO" | "REMINDER" | "ALERT";
                    };
                    replyToId?: string | null;
                    createdAt: Date;
                    updatedAt: Date;
                } | null;
                replies: Array<{
                    id: string;
                    kind: "QUESTION" | "TRACKING" | "REPLY" | "NOTIFICATION";
                    body?: string | null;
                    payload: {
                        entryDate?: string;
                        sections?: {
                            alimentacion?: string;
                            suplementos?: string;
                            actividadFisica?: string;
                        };
                        source?: "patient" | "nutritionist";
                        notificationTitle?: string;
                        notificationType?: "INFO" | "REMINDER" | "ALERT";
                    };
                    replyToId?: string | null;
                    createdAt: Date;
                    updatedAt: Date;
                }>;
            }[];
            replies: {
                id: string;
                kind: "QUESTION" | "TRACKING" | "REPLY" | "NOTIFICATION";
                body?: string | null;
                payload: {
                    entryDate?: string;
                    sections?: {
                        alimentacion?: string;
                        suplementos?: string;
                        actividadFisica?: string;
                    };
                    source?: "patient" | "nutritionist";
                    notificationTitle?: string;
                    notificationType?: "INFO" | "REMINDER" | "ALERT";
                };
                replyToId?: string | null;
                createdAt: Date;
                updatedAt: Date;
                replyTo: {
                    id: string;
                    kind: "QUESTION" | "TRACKING" | "REPLY" | "NOTIFICATION";
                    body?: string | null;
                    payload: {
                        entryDate?: string;
                        sections?: {
                            alimentacion?: string;
                            suplementos?: string;
                            actividadFisica?: string;
                        };
                        source?: "patient" | "nutritionist";
                        notificationTitle?: string;
                        notificationType?: "INFO" | "REMINDER" | "ALERT";
                    };
                    replyToId?: string | null;
                    createdAt: Date;
                    updatedAt: Date;
                } | null;
                replies: Array<{
                    id: string;
                    kind: "QUESTION" | "TRACKING" | "REPLY" | "NOTIFICATION";
                    body?: string | null;
                    payload: {
                        entryDate?: string;
                        sections?: {
                            alimentacion?: string;
                            suplementos?: string;
                            actividadFisica?: string;
                        };
                        source?: "patient" | "nutritionist";
                        notificationTitle?: string;
                        notificationType?: "INFO" | "REMINDER" | "ALERT";
                    };
                    replyToId?: string | null;
                    createdAt: Date;
                    updatedAt: Date;
                }>;
            }[];
            notifications: {
                id: string;
                kind: "QUESTION" | "TRACKING" | "REPLY" | "NOTIFICATION";
                body?: string | null;
                payload: {
                    entryDate?: string;
                    sections?: {
                        alimentacion?: string;
                        suplementos?: string;
                        actividadFisica?: string;
                    };
                    source?: "patient" | "nutritionist";
                    notificationTitle?: string;
                    notificationType?: "INFO" | "REMINDER" | "ALERT";
                };
                replyToId?: string | null;
                createdAt: Date;
                updatedAt: Date;
                replyTo: {
                    id: string;
                    kind: "QUESTION" | "TRACKING" | "REPLY" | "NOTIFICATION";
                    body?: string | null;
                    payload: {
                        entryDate?: string;
                        sections?: {
                            alimentacion?: string;
                            suplementos?: string;
                            actividadFisica?: string;
                        };
                        source?: "patient" | "nutritionist";
                        notificationTitle?: string;
                        notificationType?: "INFO" | "REMINDER" | "ALERT";
                    };
                    replyToId?: string | null;
                    createdAt: Date;
                    updatedAt: Date;
                } | null;
                replies: Array<{
                    id: string;
                    kind: "QUESTION" | "TRACKING" | "REPLY" | "NOTIFICATION";
                    body?: string | null;
                    payload: {
                        entryDate?: string;
                        sections?: {
                            alimentacion?: string;
                            suplementos?: string;
                            actividadFisica?: string;
                        };
                        source?: "patient" | "nutritionist";
                        notificationTitle?: string;
                        notificationType?: "INFO" | "REMINDER" | "ALERT";
                    };
                    replyToId?: string | null;
                    createdAt: Date;
                    updatedAt: Date;
                }>;
            }[];
            sharedResources: {
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
            }[];
            sharedDeliverables: {
                id: string;
                name: string;
                type: string;
                format: string;
                content: unknown;
                metadata: unknown;
                tags: string[];
                createdAt: Date;
                updatedAt: Date;
            }[];
        };
    }>;
    createReply(req: any, patientId: string, dto: CreatePatientPortalReplyDto): Promise<{
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
                projects: {
                    id: string;
                    name: string;
                    mode: string;
                    status: string;
                    updatedAt: Date;
                    description: string | null;
                    activeDeliverableCreation: {
                        id: string;
                        name: string;
                        type: string;
                    } | null;
                    activeDietCreation: {
                        id: string;
                        name: string;
                        type: string;
                    } | null;
                    activeRecipeCreation: {
                        id: string;
                        name: string;
                        type: string;
                    } | null;
                }[];
                documentId: string | null;
                height: number | null;
                weight: number | null;
            };
            portal: {
                activeInvitation: {
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
                } | null;
                latestInvitation: {
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
                } | null;
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
            entries: {
                id: string;
                kind: "QUESTION" | "TRACKING" | "REPLY" | "NOTIFICATION";
                body?: string | null;
                payload: {
                    entryDate?: string;
                    sections?: {
                        alimentacion?: string;
                        suplementos?: string;
                        actividadFisica?: string;
                    };
                    source?: "patient" | "nutritionist";
                    notificationTitle?: string;
                    notificationType?: "INFO" | "REMINDER" | "ALERT";
                };
                replyToId?: string | null;
                createdAt: Date;
                updatedAt: Date;
                replyTo: {
                    id: string;
                    kind: "QUESTION" | "TRACKING" | "REPLY" | "NOTIFICATION";
                    body?: string | null;
                    payload: {
                        entryDate?: string;
                        sections?: {
                            alimentacion?: string;
                            suplementos?: string;
                            actividadFisica?: string;
                        };
                        source?: "patient" | "nutritionist";
                        notificationTitle?: string;
                        notificationType?: "INFO" | "REMINDER" | "ALERT";
                    };
                    replyToId?: string | null;
                    createdAt: Date;
                    updatedAt: Date;
                } | null;
                replies: Array<{
                    id: string;
                    kind: "QUESTION" | "TRACKING" | "REPLY" | "NOTIFICATION";
                    body?: string | null;
                    payload: {
                        entryDate?: string;
                        sections?: {
                            alimentacion?: string;
                            suplementos?: string;
                            actividadFisica?: string;
                        };
                        source?: "patient" | "nutritionist";
                        notificationTitle?: string;
                        notificationType?: "INFO" | "REMINDER" | "ALERT";
                    };
                    replyToId?: string | null;
                    createdAt: Date;
                    updatedAt: Date;
                }>;
            }[];
            questions: {
                id: string;
                kind: "QUESTION" | "TRACKING" | "REPLY" | "NOTIFICATION";
                body?: string | null;
                payload: {
                    entryDate?: string;
                    sections?: {
                        alimentacion?: string;
                        suplementos?: string;
                        actividadFisica?: string;
                    };
                    source?: "patient" | "nutritionist";
                    notificationTitle?: string;
                    notificationType?: "INFO" | "REMINDER" | "ALERT";
                };
                replyToId?: string | null;
                createdAt: Date;
                updatedAt: Date;
                replyTo: {
                    id: string;
                    kind: "QUESTION" | "TRACKING" | "REPLY" | "NOTIFICATION";
                    body?: string | null;
                    payload: {
                        entryDate?: string;
                        sections?: {
                            alimentacion?: string;
                            suplementos?: string;
                            actividadFisica?: string;
                        };
                        source?: "patient" | "nutritionist";
                        notificationTitle?: string;
                        notificationType?: "INFO" | "REMINDER" | "ALERT";
                    };
                    replyToId?: string | null;
                    createdAt: Date;
                    updatedAt: Date;
                } | null;
                replies: Array<{
                    id: string;
                    kind: "QUESTION" | "TRACKING" | "REPLY" | "NOTIFICATION";
                    body?: string | null;
                    payload: {
                        entryDate?: string;
                        sections?: {
                            alimentacion?: string;
                            suplementos?: string;
                            actividadFisica?: string;
                        };
                        source?: "patient" | "nutritionist";
                        notificationTitle?: string;
                        notificationType?: "INFO" | "REMINDER" | "ALERT";
                    };
                    replyToId?: string | null;
                    createdAt: Date;
                    updatedAt: Date;
                }>;
            }[];
            tracking: {
                id: string;
                kind: "QUESTION" | "TRACKING" | "REPLY" | "NOTIFICATION";
                body?: string | null;
                payload: {
                    entryDate?: string;
                    sections?: {
                        alimentacion?: string;
                        suplementos?: string;
                        actividadFisica?: string;
                    };
                    source?: "patient" | "nutritionist";
                    notificationTitle?: string;
                    notificationType?: "INFO" | "REMINDER" | "ALERT";
                };
                replyToId?: string | null;
                createdAt: Date;
                updatedAt: Date;
                replyTo: {
                    id: string;
                    kind: "QUESTION" | "TRACKING" | "REPLY" | "NOTIFICATION";
                    body?: string | null;
                    payload: {
                        entryDate?: string;
                        sections?: {
                            alimentacion?: string;
                            suplementos?: string;
                            actividadFisica?: string;
                        };
                        source?: "patient" | "nutritionist";
                        notificationTitle?: string;
                        notificationType?: "INFO" | "REMINDER" | "ALERT";
                    };
                    replyToId?: string | null;
                    createdAt: Date;
                    updatedAt: Date;
                } | null;
                replies: Array<{
                    id: string;
                    kind: "QUESTION" | "TRACKING" | "REPLY" | "NOTIFICATION";
                    body?: string | null;
                    payload: {
                        entryDate?: string;
                        sections?: {
                            alimentacion?: string;
                            suplementos?: string;
                            actividadFisica?: string;
                        };
                        source?: "patient" | "nutritionist";
                        notificationTitle?: string;
                        notificationType?: "INFO" | "REMINDER" | "ALERT";
                    };
                    replyToId?: string | null;
                    createdAt: Date;
                    updatedAt: Date;
                }>;
            }[];
            replies: {
                id: string;
                kind: "QUESTION" | "TRACKING" | "REPLY" | "NOTIFICATION";
                body?: string | null;
                payload: {
                    entryDate?: string;
                    sections?: {
                        alimentacion?: string;
                        suplementos?: string;
                        actividadFisica?: string;
                    };
                    source?: "patient" | "nutritionist";
                    notificationTitle?: string;
                    notificationType?: "INFO" | "REMINDER" | "ALERT";
                };
                replyToId?: string | null;
                createdAt: Date;
                updatedAt: Date;
                replyTo: {
                    id: string;
                    kind: "QUESTION" | "TRACKING" | "REPLY" | "NOTIFICATION";
                    body?: string | null;
                    payload: {
                        entryDate?: string;
                        sections?: {
                            alimentacion?: string;
                            suplementos?: string;
                            actividadFisica?: string;
                        };
                        source?: "patient" | "nutritionist";
                        notificationTitle?: string;
                        notificationType?: "INFO" | "REMINDER" | "ALERT";
                    };
                    replyToId?: string | null;
                    createdAt: Date;
                    updatedAt: Date;
                } | null;
                replies: Array<{
                    id: string;
                    kind: "QUESTION" | "TRACKING" | "REPLY" | "NOTIFICATION";
                    body?: string | null;
                    payload: {
                        entryDate?: string;
                        sections?: {
                            alimentacion?: string;
                            suplementos?: string;
                            actividadFisica?: string;
                        };
                        source?: "patient" | "nutritionist";
                        notificationTitle?: string;
                        notificationType?: "INFO" | "REMINDER" | "ALERT";
                    };
                    replyToId?: string | null;
                    createdAt: Date;
                    updatedAt: Date;
                }>;
            }[];
            notifications: {
                id: string;
                kind: "QUESTION" | "TRACKING" | "REPLY" | "NOTIFICATION";
                body?: string | null;
                payload: {
                    entryDate?: string;
                    sections?: {
                        alimentacion?: string;
                        suplementos?: string;
                        actividadFisica?: string;
                    };
                    source?: "patient" | "nutritionist";
                    notificationTitle?: string;
                    notificationType?: "INFO" | "REMINDER" | "ALERT";
                };
                replyToId?: string | null;
                createdAt: Date;
                updatedAt: Date;
                replyTo: {
                    id: string;
                    kind: "QUESTION" | "TRACKING" | "REPLY" | "NOTIFICATION";
                    body?: string | null;
                    payload: {
                        entryDate?: string;
                        sections?: {
                            alimentacion?: string;
                            suplementos?: string;
                            actividadFisica?: string;
                        };
                        source?: "patient" | "nutritionist";
                        notificationTitle?: string;
                        notificationType?: "INFO" | "REMINDER" | "ALERT";
                    };
                    replyToId?: string | null;
                    createdAt: Date;
                    updatedAt: Date;
                } | null;
                replies: Array<{
                    id: string;
                    kind: "QUESTION" | "TRACKING" | "REPLY" | "NOTIFICATION";
                    body?: string | null;
                    payload: {
                        entryDate?: string;
                        sections?: {
                            alimentacion?: string;
                            suplementos?: string;
                            actividadFisica?: string;
                        };
                        source?: "patient" | "nutritionist";
                        notificationTitle?: string;
                        notificationType?: "INFO" | "REMINDER" | "ALERT";
                    };
                    replyToId?: string | null;
                    createdAt: Date;
                    updatedAt: Date;
                }>;
            }[];
            sharedResources: {
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
            }[];
            sharedDeliverables: {
                id: string;
                name: string;
                type: string;
                format: string;
                content: unknown;
                metadata: unknown;
                tags: string[];
                createdAt: Date;
                updatedAt: Date;
            }[];
        };
    }>;
    createNotification(req: any, patientId: string, dto: CreatePatientPortalNotificationDto): Promise<{
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
                projects: {
                    id: string;
                    name: string;
                    mode: string;
                    status: string;
                    updatedAt: Date;
                    description: string | null;
                    activeDeliverableCreation: {
                        id: string;
                        name: string;
                        type: string;
                    } | null;
                    activeDietCreation: {
                        id: string;
                        name: string;
                        type: string;
                    } | null;
                    activeRecipeCreation: {
                        id: string;
                        name: string;
                        type: string;
                    } | null;
                }[];
                documentId: string | null;
                height: number | null;
                weight: number | null;
            };
            portal: {
                activeInvitation: {
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
                } | null;
                latestInvitation: {
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
                } | null;
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
            entries: {
                id: string;
                kind: "QUESTION" | "TRACKING" | "REPLY" | "NOTIFICATION";
                body?: string | null;
                payload: {
                    entryDate?: string;
                    sections?: {
                        alimentacion?: string;
                        suplementos?: string;
                        actividadFisica?: string;
                    };
                    source?: "patient" | "nutritionist";
                    notificationTitle?: string;
                    notificationType?: "INFO" | "REMINDER" | "ALERT";
                };
                replyToId?: string | null;
                createdAt: Date;
                updatedAt: Date;
                replyTo: {
                    id: string;
                    kind: "QUESTION" | "TRACKING" | "REPLY" | "NOTIFICATION";
                    body?: string | null;
                    payload: {
                        entryDate?: string;
                        sections?: {
                            alimentacion?: string;
                            suplementos?: string;
                            actividadFisica?: string;
                        };
                        source?: "patient" | "nutritionist";
                        notificationTitle?: string;
                        notificationType?: "INFO" | "REMINDER" | "ALERT";
                    };
                    replyToId?: string | null;
                    createdAt: Date;
                    updatedAt: Date;
                } | null;
                replies: Array<{
                    id: string;
                    kind: "QUESTION" | "TRACKING" | "REPLY" | "NOTIFICATION";
                    body?: string | null;
                    payload: {
                        entryDate?: string;
                        sections?: {
                            alimentacion?: string;
                            suplementos?: string;
                            actividadFisica?: string;
                        };
                        source?: "patient" | "nutritionist";
                        notificationTitle?: string;
                        notificationType?: "INFO" | "REMINDER" | "ALERT";
                    };
                    replyToId?: string | null;
                    createdAt: Date;
                    updatedAt: Date;
                }>;
            }[];
            questions: {
                id: string;
                kind: "QUESTION" | "TRACKING" | "REPLY" | "NOTIFICATION";
                body?: string | null;
                payload: {
                    entryDate?: string;
                    sections?: {
                        alimentacion?: string;
                        suplementos?: string;
                        actividadFisica?: string;
                    };
                    source?: "patient" | "nutritionist";
                    notificationTitle?: string;
                    notificationType?: "INFO" | "REMINDER" | "ALERT";
                };
                replyToId?: string | null;
                createdAt: Date;
                updatedAt: Date;
                replyTo: {
                    id: string;
                    kind: "QUESTION" | "TRACKING" | "REPLY" | "NOTIFICATION";
                    body?: string | null;
                    payload: {
                        entryDate?: string;
                        sections?: {
                            alimentacion?: string;
                            suplementos?: string;
                            actividadFisica?: string;
                        };
                        source?: "patient" | "nutritionist";
                        notificationTitle?: string;
                        notificationType?: "INFO" | "REMINDER" | "ALERT";
                    };
                    replyToId?: string | null;
                    createdAt: Date;
                    updatedAt: Date;
                } | null;
                replies: Array<{
                    id: string;
                    kind: "QUESTION" | "TRACKING" | "REPLY" | "NOTIFICATION";
                    body?: string | null;
                    payload: {
                        entryDate?: string;
                        sections?: {
                            alimentacion?: string;
                            suplementos?: string;
                            actividadFisica?: string;
                        };
                        source?: "patient" | "nutritionist";
                        notificationTitle?: string;
                        notificationType?: "INFO" | "REMINDER" | "ALERT";
                    };
                    replyToId?: string | null;
                    createdAt: Date;
                    updatedAt: Date;
                }>;
            }[];
            tracking: {
                id: string;
                kind: "QUESTION" | "TRACKING" | "REPLY" | "NOTIFICATION";
                body?: string | null;
                payload: {
                    entryDate?: string;
                    sections?: {
                        alimentacion?: string;
                        suplementos?: string;
                        actividadFisica?: string;
                    };
                    source?: "patient" | "nutritionist";
                    notificationTitle?: string;
                    notificationType?: "INFO" | "REMINDER" | "ALERT";
                };
                replyToId?: string | null;
                createdAt: Date;
                updatedAt: Date;
                replyTo: {
                    id: string;
                    kind: "QUESTION" | "TRACKING" | "REPLY" | "NOTIFICATION";
                    body?: string | null;
                    payload: {
                        entryDate?: string;
                        sections?: {
                            alimentacion?: string;
                            suplementos?: string;
                            actividadFisica?: string;
                        };
                        source?: "patient" | "nutritionist";
                        notificationTitle?: string;
                        notificationType?: "INFO" | "REMINDER" | "ALERT";
                    };
                    replyToId?: string | null;
                    createdAt: Date;
                    updatedAt: Date;
                } | null;
                replies: Array<{
                    id: string;
                    kind: "QUESTION" | "TRACKING" | "REPLY" | "NOTIFICATION";
                    body?: string | null;
                    payload: {
                        entryDate?: string;
                        sections?: {
                            alimentacion?: string;
                            suplementos?: string;
                            actividadFisica?: string;
                        };
                        source?: "patient" | "nutritionist";
                        notificationTitle?: string;
                        notificationType?: "INFO" | "REMINDER" | "ALERT";
                    };
                    replyToId?: string | null;
                    createdAt: Date;
                    updatedAt: Date;
                }>;
            }[];
            replies: {
                id: string;
                kind: "QUESTION" | "TRACKING" | "REPLY" | "NOTIFICATION";
                body?: string | null;
                payload: {
                    entryDate?: string;
                    sections?: {
                        alimentacion?: string;
                        suplementos?: string;
                        actividadFisica?: string;
                    };
                    source?: "patient" | "nutritionist";
                    notificationTitle?: string;
                    notificationType?: "INFO" | "REMINDER" | "ALERT";
                };
                replyToId?: string | null;
                createdAt: Date;
                updatedAt: Date;
                replyTo: {
                    id: string;
                    kind: "QUESTION" | "TRACKING" | "REPLY" | "NOTIFICATION";
                    body?: string | null;
                    payload: {
                        entryDate?: string;
                        sections?: {
                            alimentacion?: string;
                            suplementos?: string;
                            actividadFisica?: string;
                        };
                        source?: "patient" | "nutritionist";
                        notificationTitle?: string;
                        notificationType?: "INFO" | "REMINDER" | "ALERT";
                    };
                    replyToId?: string | null;
                    createdAt: Date;
                    updatedAt: Date;
                } | null;
                replies: Array<{
                    id: string;
                    kind: "QUESTION" | "TRACKING" | "REPLY" | "NOTIFICATION";
                    body?: string | null;
                    payload: {
                        entryDate?: string;
                        sections?: {
                            alimentacion?: string;
                            suplementos?: string;
                            actividadFisica?: string;
                        };
                        source?: "patient" | "nutritionist";
                        notificationTitle?: string;
                        notificationType?: "INFO" | "REMINDER" | "ALERT";
                    };
                    replyToId?: string | null;
                    createdAt: Date;
                    updatedAt: Date;
                }>;
            }[];
            notifications: {
                id: string;
                kind: "QUESTION" | "TRACKING" | "REPLY" | "NOTIFICATION";
                body?: string | null;
                payload: {
                    entryDate?: string;
                    sections?: {
                        alimentacion?: string;
                        suplementos?: string;
                        actividadFisica?: string;
                    };
                    source?: "patient" | "nutritionist";
                    notificationTitle?: string;
                    notificationType?: "INFO" | "REMINDER" | "ALERT";
                };
                replyToId?: string | null;
                createdAt: Date;
                updatedAt: Date;
                replyTo: {
                    id: string;
                    kind: "QUESTION" | "TRACKING" | "REPLY" | "NOTIFICATION";
                    body?: string | null;
                    payload: {
                        entryDate?: string;
                        sections?: {
                            alimentacion?: string;
                            suplementos?: string;
                            actividadFisica?: string;
                        };
                        source?: "patient" | "nutritionist";
                        notificationTitle?: string;
                        notificationType?: "INFO" | "REMINDER" | "ALERT";
                    };
                    replyToId?: string | null;
                    createdAt: Date;
                    updatedAt: Date;
                } | null;
                replies: Array<{
                    id: string;
                    kind: "QUESTION" | "TRACKING" | "REPLY" | "NOTIFICATION";
                    body?: string | null;
                    payload: {
                        entryDate?: string;
                        sections?: {
                            alimentacion?: string;
                            suplementos?: string;
                            actividadFisica?: string;
                        };
                        source?: "patient" | "nutritionist";
                        notificationTitle?: string;
                        notificationType?: "INFO" | "REMINDER" | "ALERT";
                    };
                    replyToId?: string | null;
                    createdAt: Date;
                    updatedAt: Date;
                }>;
            }[];
            sharedResources: {
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
            }[];
            sharedDeliverables: {
                id: string;
                name: string;
                type: string;
                format: string;
                content: unknown;
                metadata: unknown;
                tags: string[];
                createdAt: Date;
                updatedAt: Date;
            }[];
        };
    }>;
    setAccessStatus(req: any, patientId: string, body: {
        status: 'ACTIVE' | 'BLOCKED';
    }): Promise<{
        invitation: {
            id: string;
            status: string;
            updatedAt: Date;
            revokedAt: Date | null;
            blockedAt: Date | null;
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
                projects: {
                    id: string;
                    name: string;
                    mode: string;
                    status: string;
                    updatedAt: Date;
                    description: string | null;
                    activeDeliverableCreation: {
                        id: string;
                        name: string;
                        type: string;
                    } | null;
                    activeDietCreation: {
                        id: string;
                        name: string;
                        type: string;
                    } | null;
                    activeRecipeCreation: {
                        id: string;
                        name: string;
                        type: string;
                    } | null;
                }[];
                documentId: string | null;
                height: number | null;
                weight: number | null;
            };
            portal: {
                activeInvitation: {
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
                } | null;
                latestInvitation: {
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
                } | null;
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
            entries: {
                id: string;
                kind: "QUESTION" | "TRACKING" | "REPLY" | "NOTIFICATION";
                body?: string | null;
                payload: {
                    entryDate?: string;
                    sections?: {
                        alimentacion?: string;
                        suplementos?: string;
                        actividadFisica?: string;
                    };
                    source?: "patient" | "nutritionist";
                    notificationTitle?: string;
                    notificationType?: "INFO" | "REMINDER" | "ALERT";
                };
                replyToId?: string | null;
                createdAt: Date;
                updatedAt: Date;
                replyTo: {
                    id: string;
                    kind: "QUESTION" | "TRACKING" | "REPLY" | "NOTIFICATION";
                    body?: string | null;
                    payload: {
                        entryDate?: string;
                        sections?: {
                            alimentacion?: string;
                            suplementos?: string;
                            actividadFisica?: string;
                        };
                        source?: "patient" | "nutritionist";
                        notificationTitle?: string;
                        notificationType?: "INFO" | "REMINDER" | "ALERT";
                    };
                    replyToId?: string | null;
                    createdAt: Date;
                    updatedAt: Date;
                } | null;
                replies: Array<{
                    id: string;
                    kind: "QUESTION" | "TRACKING" | "REPLY" | "NOTIFICATION";
                    body?: string | null;
                    payload: {
                        entryDate?: string;
                        sections?: {
                            alimentacion?: string;
                            suplementos?: string;
                            actividadFisica?: string;
                        };
                        source?: "patient" | "nutritionist";
                        notificationTitle?: string;
                        notificationType?: "INFO" | "REMINDER" | "ALERT";
                    };
                    replyToId?: string | null;
                    createdAt: Date;
                    updatedAt: Date;
                }>;
            }[];
            questions: {
                id: string;
                kind: "QUESTION" | "TRACKING" | "REPLY" | "NOTIFICATION";
                body?: string | null;
                payload: {
                    entryDate?: string;
                    sections?: {
                        alimentacion?: string;
                        suplementos?: string;
                        actividadFisica?: string;
                    };
                    source?: "patient" | "nutritionist";
                    notificationTitle?: string;
                    notificationType?: "INFO" | "REMINDER" | "ALERT";
                };
                replyToId?: string | null;
                createdAt: Date;
                updatedAt: Date;
                replyTo: {
                    id: string;
                    kind: "QUESTION" | "TRACKING" | "REPLY" | "NOTIFICATION";
                    body?: string | null;
                    payload: {
                        entryDate?: string;
                        sections?: {
                            alimentacion?: string;
                            suplementos?: string;
                            actividadFisica?: string;
                        };
                        source?: "patient" | "nutritionist";
                        notificationTitle?: string;
                        notificationType?: "INFO" | "REMINDER" | "ALERT";
                    };
                    replyToId?: string | null;
                    createdAt: Date;
                    updatedAt: Date;
                } | null;
                replies: Array<{
                    id: string;
                    kind: "QUESTION" | "TRACKING" | "REPLY" | "NOTIFICATION";
                    body?: string | null;
                    payload: {
                        entryDate?: string;
                        sections?: {
                            alimentacion?: string;
                            suplementos?: string;
                            actividadFisica?: string;
                        };
                        source?: "patient" | "nutritionist";
                        notificationTitle?: string;
                        notificationType?: "INFO" | "REMINDER" | "ALERT";
                    };
                    replyToId?: string | null;
                    createdAt: Date;
                    updatedAt: Date;
                }>;
            }[];
            tracking: {
                id: string;
                kind: "QUESTION" | "TRACKING" | "REPLY" | "NOTIFICATION";
                body?: string | null;
                payload: {
                    entryDate?: string;
                    sections?: {
                        alimentacion?: string;
                        suplementos?: string;
                        actividadFisica?: string;
                    };
                    source?: "patient" | "nutritionist";
                    notificationTitle?: string;
                    notificationType?: "INFO" | "REMINDER" | "ALERT";
                };
                replyToId?: string | null;
                createdAt: Date;
                updatedAt: Date;
                replyTo: {
                    id: string;
                    kind: "QUESTION" | "TRACKING" | "REPLY" | "NOTIFICATION";
                    body?: string | null;
                    payload: {
                        entryDate?: string;
                        sections?: {
                            alimentacion?: string;
                            suplementos?: string;
                            actividadFisica?: string;
                        };
                        source?: "patient" | "nutritionist";
                        notificationTitle?: string;
                        notificationType?: "INFO" | "REMINDER" | "ALERT";
                    };
                    replyToId?: string | null;
                    createdAt: Date;
                    updatedAt: Date;
                } | null;
                replies: Array<{
                    id: string;
                    kind: "QUESTION" | "TRACKING" | "REPLY" | "NOTIFICATION";
                    body?: string | null;
                    payload: {
                        entryDate?: string;
                        sections?: {
                            alimentacion?: string;
                            suplementos?: string;
                            actividadFisica?: string;
                        };
                        source?: "patient" | "nutritionist";
                        notificationTitle?: string;
                        notificationType?: "INFO" | "REMINDER" | "ALERT";
                    };
                    replyToId?: string | null;
                    createdAt: Date;
                    updatedAt: Date;
                }>;
            }[];
            replies: {
                id: string;
                kind: "QUESTION" | "TRACKING" | "REPLY" | "NOTIFICATION";
                body?: string | null;
                payload: {
                    entryDate?: string;
                    sections?: {
                        alimentacion?: string;
                        suplementos?: string;
                        actividadFisica?: string;
                    };
                    source?: "patient" | "nutritionist";
                    notificationTitle?: string;
                    notificationType?: "INFO" | "REMINDER" | "ALERT";
                };
                replyToId?: string | null;
                createdAt: Date;
                updatedAt: Date;
                replyTo: {
                    id: string;
                    kind: "QUESTION" | "TRACKING" | "REPLY" | "NOTIFICATION";
                    body?: string | null;
                    payload: {
                        entryDate?: string;
                        sections?: {
                            alimentacion?: string;
                            suplementos?: string;
                            actividadFisica?: string;
                        };
                        source?: "patient" | "nutritionist";
                        notificationTitle?: string;
                        notificationType?: "INFO" | "REMINDER" | "ALERT";
                    };
                    replyToId?: string | null;
                    createdAt: Date;
                    updatedAt: Date;
                } | null;
                replies: Array<{
                    id: string;
                    kind: "QUESTION" | "TRACKING" | "REPLY" | "NOTIFICATION";
                    body?: string | null;
                    payload: {
                        entryDate?: string;
                        sections?: {
                            alimentacion?: string;
                            suplementos?: string;
                            actividadFisica?: string;
                        };
                        source?: "patient" | "nutritionist";
                        notificationTitle?: string;
                        notificationType?: "INFO" | "REMINDER" | "ALERT";
                    };
                    replyToId?: string | null;
                    createdAt: Date;
                    updatedAt: Date;
                }>;
            }[];
            notifications: {
                id: string;
                kind: "QUESTION" | "TRACKING" | "REPLY" | "NOTIFICATION";
                body?: string | null;
                payload: {
                    entryDate?: string;
                    sections?: {
                        alimentacion?: string;
                        suplementos?: string;
                        actividadFisica?: string;
                    };
                    source?: "patient" | "nutritionist";
                    notificationTitle?: string;
                    notificationType?: "INFO" | "REMINDER" | "ALERT";
                };
                replyToId?: string | null;
                createdAt: Date;
                updatedAt: Date;
                replyTo: {
                    id: string;
                    kind: "QUESTION" | "TRACKING" | "REPLY" | "NOTIFICATION";
                    body?: string | null;
                    payload: {
                        entryDate?: string;
                        sections?: {
                            alimentacion?: string;
                            suplementos?: string;
                            actividadFisica?: string;
                        };
                        source?: "patient" | "nutritionist";
                        notificationTitle?: string;
                        notificationType?: "INFO" | "REMINDER" | "ALERT";
                    };
                    replyToId?: string | null;
                    createdAt: Date;
                    updatedAt: Date;
                } | null;
                replies: Array<{
                    id: string;
                    kind: "QUESTION" | "TRACKING" | "REPLY" | "NOTIFICATION";
                    body?: string | null;
                    payload: {
                        entryDate?: string;
                        sections?: {
                            alimentacion?: string;
                            suplementos?: string;
                            actividadFisica?: string;
                        };
                        source?: "patient" | "nutritionist";
                        notificationTitle?: string;
                        notificationType?: "INFO" | "REMINDER" | "ALERT";
                    };
                    replyToId?: string | null;
                    createdAt: Date;
                    updatedAt: Date;
                }>;
            }[];
            sharedResources: {
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
            }[];
            sharedDeliverables: {
                id: string;
                name: string;
                type: string;
                format: string;
                content: unknown;
                metadata: unknown;
                tags: string[];
                createdAt: Date;
                updatedAt: Date;
            }[];
        };
    }>;
}
