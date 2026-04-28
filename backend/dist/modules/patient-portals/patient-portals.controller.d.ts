import { PatientPortalsService } from './patient-portals.service';
import { CreatePatientPortalInvitationDto } from './dto/create-patient-portal-invitation.dto';
import { CreatePatientPortalEntryDto } from './dto/create-patient-portal-entry.dto';
import { CreatePatientPortalQuestionDto } from './dto/create-patient-portal-question.dto';
import { CreatePatientPortalReplyDto } from './dto/create-patient-portal-reply.dto';
export declare class PatientPortalsController {
    private readonly patientPortalsService;
    constructor(patientPortalsService: PatientPortalsService);
    createInvitation(req: any, patientId: string, dto: CreatePatientPortalInvitationDto): Promise<{
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
            activeInvitation: {
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
            latestEntryAt: Date;
            daysSinceLastEntry: number | null;
            sectionCounts: {
                alimentacion: number;
                suplementos: number;
                actividadFisica: number;
            };
            alerts: string[];
        };
        entries: {
            id: string;
            kind: "QUESTION" | "TRACKING" | "REPLY";
            body?: string | null;
            payload: {
                sections?: {
                    alimentacion?: string;
                    suplementos?: string;
                    actividadFisica?: string;
                };
                source?: "patient" | "nutritionist";
            };
            replyToId?: string | null;
            createdAt: Date;
            updatedAt: Date;
            replyTo: {
                id: string;
                kind: "QUESTION" | "TRACKING" | "REPLY";
                body?: string | null;
                payload: {
                    sections?: {
                        alimentacion?: string;
                        suplementos?: string;
                        actividadFisica?: string;
                    };
                    source?: "patient" | "nutritionist";
                };
                replyToId?: string | null;
                createdAt: Date;
                updatedAt: Date;
            } | null;
            replies: Array<{
                id: string;
                kind: "QUESTION" | "TRACKING" | "REPLY";
                body?: string | null;
                payload: {
                    sections?: {
                        alimentacion?: string;
                        suplementos?: string;
                        actividadFisica?: string;
                    };
                    source?: "patient" | "nutritionist";
                };
                replyToId?: string | null;
                createdAt: Date;
                updatedAt: Date;
            }>;
        }[];
        questions: {
            id: string;
            kind: "QUESTION" | "TRACKING" | "REPLY";
            body?: string | null;
            payload: {
                sections?: {
                    alimentacion?: string;
                    suplementos?: string;
                    actividadFisica?: string;
                };
                source?: "patient" | "nutritionist";
            };
            replyToId?: string | null;
            createdAt: Date;
            updatedAt: Date;
            replyTo: {
                id: string;
                kind: "QUESTION" | "TRACKING" | "REPLY";
                body?: string | null;
                payload: {
                    sections?: {
                        alimentacion?: string;
                        suplementos?: string;
                        actividadFisica?: string;
                    };
                    source?: "patient" | "nutritionist";
                };
                replyToId?: string | null;
                createdAt: Date;
                updatedAt: Date;
            } | null;
            replies: Array<{
                id: string;
                kind: "QUESTION" | "TRACKING" | "REPLY";
                body?: string | null;
                payload: {
                    sections?: {
                        alimentacion?: string;
                        suplementos?: string;
                        actividadFisica?: string;
                    };
                    source?: "patient" | "nutritionist";
                };
                replyToId?: string | null;
                createdAt: Date;
                updatedAt: Date;
            }>;
        }[];
        tracking: {
            id: string;
            kind: "QUESTION" | "TRACKING" | "REPLY";
            body?: string | null;
            payload: {
                sections?: {
                    alimentacion?: string;
                    suplementos?: string;
                    actividadFisica?: string;
                };
                source?: "patient" | "nutritionist";
            };
            replyToId?: string | null;
            createdAt: Date;
            updatedAt: Date;
            replyTo: {
                id: string;
                kind: "QUESTION" | "TRACKING" | "REPLY";
                body?: string | null;
                payload: {
                    sections?: {
                        alimentacion?: string;
                        suplementos?: string;
                        actividadFisica?: string;
                    };
                    source?: "patient" | "nutritionist";
                };
                replyToId?: string | null;
                createdAt: Date;
                updatedAt: Date;
            } | null;
            replies: Array<{
                id: string;
                kind: "QUESTION" | "TRACKING" | "REPLY";
                body?: string | null;
                payload: {
                    sections?: {
                        alimentacion?: string;
                        suplementos?: string;
                        actividadFisica?: string;
                    };
                    source?: "patient" | "nutritionist";
                };
                replyToId?: string | null;
                createdAt: Date;
                updatedAt: Date;
            }>;
        }[];
        replies: {
            id: string;
            kind: "QUESTION" | "TRACKING" | "REPLY";
            body?: string | null;
            payload: {
                sections?: {
                    alimentacion?: string;
                    suplementos?: string;
                    actividadFisica?: string;
                };
                source?: "patient" | "nutritionist";
            };
            replyToId?: string | null;
            createdAt: Date;
            updatedAt: Date;
            replyTo: {
                id: string;
                kind: "QUESTION" | "TRACKING" | "REPLY";
                body?: string | null;
                payload: {
                    sections?: {
                        alimentacion?: string;
                        suplementos?: string;
                        actividadFisica?: string;
                    };
                    source?: "patient" | "nutritionist";
                };
                replyToId?: string | null;
                createdAt: Date;
                updatedAt: Date;
            } | null;
            replies: Array<{
                id: string;
                kind: "QUESTION" | "TRACKING" | "REPLY";
                body?: string | null;
                payload: {
                    sections?: {
                        alimentacion?: string;
                        suplementos?: string;
                        actividadFisica?: string;
                    };
                    source?: "patient" | "nutritionist";
                };
                replyToId?: string | null;
                createdAt: Date;
                updatedAt: Date;
            }>;
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
            activeInvitation: {
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
            latestEntryAt: Date;
            daysSinceLastEntry: number | null;
            sectionCounts: {
                alimentacion: number;
                suplementos: number;
                actividadFisica: number;
            };
            alerts: string[];
        };
        entries: {
            id: string;
            kind: "QUESTION" | "TRACKING" | "REPLY";
            body?: string | null;
            payload: {
                sections?: {
                    alimentacion?: string;
                    suplementos?: string;
                    actividadFisica?: string;
                };
                source?: "patient" | "nutritionist";
            };
            replyToId?: string | null;
            createdAt: Date;
            updatedAt: Date;
            replyTo: {
                id: string;
                kind: "QUESTION" | "TRACKING" | "REPLY";
                body?: string | null;
                payload: {
                    sections?: {
                        alimentacion?: string;
                        suplementos?: string;
                        actividadFisica?: string;
                    };
                    source?: "patient" | "nutritionist";
                };
                replyToId?: string | null;
                createdAt: Date;
                updatedAt: Date;
            } | null;
            replies: Array<{
                id: string;
                kind: "QUESTION" | "TRACKING" | "REPLY";
                body?: string | null;
                payload: {
                    sections?: {
                        alimentacion?: string;
                        suplementos?: string;
                        actividadFisica?: string;
                    };
                    source?: "patient" | "nutritionist";
                };
                replyToId?: string | null;
                createdAt: Date;
                updatedAt: Date;
            }>;
        }[];
        questions: {
            id: string;
            kind: "QUESTION" | "TRACKING" | "REPLY";
            body?: string | null;
            payload: {
                sections?: {
                    alimentacion?: string;
                    suplementos?: string;
                    actividadFisica?: string;
                };
                source?: "patient" | "nutritionist";
            };
            replyToId?: string | null;
            createdAt: Date;
            updatedAt: Date;
            replyTo: {
                id: string;
                kind: "QUESTION" | "TRACKING" | "REPLY";
                body?: string | null;
                payload: {
                    sections?: {
                        alimentacion?: string;
                        suplementos?: string;
                        actividadFisica?: string;
                    };
                    source?: "patient" | "nutritionist";
                };
                replyToId?: string | null;
                createdAt: Date;
                updatedAt: Date;
            } | null;
            replies: Array<{
                id: string;
                kind: "QUESTION" | "TRACKING" | "REPLY";
                body?: string | null;
                payload: {
                    sections?: {
                        alimentacion?: string;
                        suplementos?: string;
                        actividadFisica?: string;
                    };
                    source?: "patient" | "nutritionist";
                };
                replyToId?: string | null;
                createdAt: Date;
                updatedAt: Date;
            }>;
        }[];
        tracking: {
            id: string;
            kind: "QUESTION" | "TRACKING" | "REPLY";
            body?: string | null;
            payload: {
                sections?: {
                    alimentacion?: string;
                    suplementos?: string;
                    actividadFisica?: string;
                };
                source?: "patient" | "nutritionist";
            };
            replyToId?: string | null;
            createdAt: Date;
            updatedAt: Date;
            replyTo: {
                id: string;
                kind: "QUESTION" | "TRACKING" | "REPLY";
                body?: string | null;
                payload: {
                    sections?: {
                        alimentacion?: string;
                        suplementos?: string;
                        actividadFisica?: string;
                    };
                    source?: "patient" | "nutritionist";
                };
                replyToId?: string | null;
                createdAt: Date;
                updatedAt: Date;
            } | null;
            replies: Array<{
                id: string;
                kind: "QUESTION" | "TRACKING" | "REPLY";
                body?: string | null;
                payload: {
                    sections?: {
                        alimentacion?: string;
                        suplementos?: string;
                        actividadFisica?: string;
                    };
                    source?: "patient" | "nutritionist";
                };
                replyToId?: string | null;
                createdAt: Date;
                updatedAt: Date;
            }>;
        }[];
        replies: {
            id: string;
            kind: "QUESTION" | "TRACKING" | "REPLY";
            body?: string | null;
            payload: {
                sections?: {
                    alimentacion?: string;
                    suplementos?: string;
                    actividadFisica?: string;
                };
                source?: "patient" | "nutritionist";
            };
            replyToId?: string | null;
            createdAt: Date;
            updatedAt: Date;
            replyTo: {
                id: string;
                kind: "QUESTION" | "TRACKING" | "REPLY";
                body?: string | null;
                payload: {
                    sections?: {
                        alimentacion?: string;
                        suplementos?: string;
                        actividadFisica?: string;
                    };
                    source?: "patient" | "nutritionist";
                };
                replyToId?: string | null;
                createdAt: Date;
                updatedAt: Date;
            } | null;
            replies: Array<{
                id: string;
                kind: "QUESTION" | "TRACKING" | "REPLY";
                body?: string | null;
                payload: {
                    sections?: {
                        alimentacion?: string;
                        suplementos?: string;
                        actividadFisica?: string;
                    };
                    source?: "patient" | "nutritionist";
                };
                replyToId?: string | null;
                createdAt: Date;
                updatedAt: Date;
            }>;
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
            activeInvitation: {
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
            latestEntryAt: Date;
            daysSinceLastEntry: number | null;
            sectionCounts: {
                alimentacion: number;
                suplementos: number;
                actividadFisica: number;
            };
            alerts: string[];
        };
        entries: {
            id: string;
            kind: "QUESTION" | "TRACKING" | "REPLY";
            body?: string | null;
            payload: {
                sections?: {
                    alimentacion?: string;
                    suplementos?: string;
                    actividadFisica?: string;
                };
                source?: "patient" | "nutritionist";
            };
            replyToId?: string | null;
            createdAt: Date;
            updatedAt: Date;
            replyTo: {
                id: string;
                kind: "QUESTION" | "TRACKING" | "REPLY";
                body?: string | null;
                payload: {
                    sections?: {
                        alimentacion?: string;
                        suplementos?: string;
                        actividadFisica?: string;
                    };
                    source?: "patient" | "nutritionist";
                };
                replyToId?: string | null;
                createdAt: Date;
                updatedAt: Date;
            } | null;
            replies: Array<{
                id: string;
                kind: "QUESTION" | "TRACKING" | "REPLY";
                body?: string | null;
                payload: {
                    sections?: {
                        alimentacion?: string;
                        suplementos?: string;
                        actividadFisica?: string;
                    };
                    source?: "patient" | "nutritionist";
                };
                replyToId?: string | null;
                createdAt: Date;
                updatedAt: Date;
            }>;
        }[];
        questions: {
            id: string;
            kind: "QUESTION" | "TRACKING" | "REPLY";
            body?: string | null;
            payload: {
                sections?: {
                    alimentacion?: string;
                    suplementos?: string;
                    actividadFisica?: string;
                };
                source?: "patient" | "nutritionist";
            };
            replyToId?: string | null;
            createdAt: Date;
            updatedAt: Date;
            replyTo: {
                id: string;
                kind: "QUESTION" | "TRACKING" | "REPLY";
                body?: string | null;
                payload: {
                    sections?: {
                        alimentacion?: string;
                        suplementos?: string;
                        actividadFisica?: string;
                    };
                    source?: "patient" | "nutritionist";
                };
                replyToId?: string | null;
                createdAt: Date;
                updatedAt: Date;
            } | null;
            replies: Array<{
                id: string;
                kind: "QUESTION" | "TRACKING" | "REPLY";
                body?: string | null;
                payload: {
                    sections?: {
                        alimentacion?: string;
                        suplementos?: string;
                        actividadFisica?: string;
                    };
                    source?: "patient" | "nutritionist";
                };
                replyToId?: string | null;
                createdAt: Date;
                updatedAt: Date;
            }>;
        }[];
        tracking: {
            id: string;
            kind: "QUESTION" | "TRACKING" | "REPLY";
            body?: string | null;
            payload: {
                sections?: {
                    alimentacion?: string;
                    suplementos?: string;
                    actividadFisica?: string;
                };
                source?: "patient" | "nutritionist";
            };
            replyToId?: string | null;
            createdAt: Date;
            updatedAt: Date;
            replyTo: {
                id: string;
                kind: "QUESTION" | "TRACKING" | "REPLY";
                body?: string | null;
                payload: {
                    sections?: {
                        alimentacion?: string;
                        suplementos?: string;
                        actividadFisica?: string;
                    };
                    source?: "patient" | "nutritionist";
                };
                replyToId?: string | null;
                createdAt: Date;
                updatedAt: Date;
            } | null;
            replies: Array<{
                id: string;
                kind: "QUESTION" | "TRACKING" | "REPLY";
                body?: string | null;
                payload: {
                    sections?: {
                        alimentacion?: string;
                        suplementos?: string;
                        actividadFisica?: string;
                    };
                    source?: "patient" | "nutritionist";
                };
                replyToId?: string | null;
                createdAt: Date;
                updatedAt: Date;
            }>;
        }[];
        replies: {
            id: string;
            kind: "QUESTION" | "TRACKING" | "REPLY";
            body?: string | null;
            payload: {
                sections?: {
                    alimentacion?: string;
                    suplementos?: string;
                    actividadFisica?: string;
                };
                source?: "patient" | "nutritionist";
            };
            replyToId?: string | null;
            createdAt: Date;
            updatedAt: Date;
            replyTo: {
                id: string;
                kind: "QUESTION" | "TRACKING" | "REPLY";
                body?: string | null;
                payload: {
                    sections?: {
                        alimentacion?: string;
                        suplementos?: string;
                        actividadFisica?: string;
                    };
                    source?: "patient" | "nutritionist";
                };
                replyToId?: string | null;
                createdAt: Date;
                updatedAt: Date;
            } | null;
            replies: Array<{
                id: string;
                kind: "QUESTION" | "TRACKING" | "REPLY";
                body?: string | null;
                payload: {
                    sections?: {
                        alimentacion?: string;
                        suplementos?: string;
                        actividadFisica?: string;
                    };
                    source?: "patient" | "nutritionist";
                };
                replyToId?: string | null;
                createdAt: Date;
                updatedAt: Date;
            }>;
        }[];
    }>;
    createQuestion(req: any, dto: CreatePatientPortalQuestionDto): Promise<{
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
                activeInvitation: {
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
                latestEntryAt: Date;
                daysSinceLastEntry: number | null;
                sectionCounts: {
                    alimentacion: number;
                    suplementos: number;
                    actividadFisica: number;
                };
                alerts: string[];
            };
            entries: {
                id: string;
                kind: "QUESTION" | "TRACKING" | "REPLY";
                body?: string | null;
                payload: {
                    sections?: {
                        alimentacion?: string;
                        suplementos?: string;
                        actividadFisica?: string;
                    };
                    source?: "patient" | "nutritionist";
                };
                replyToId?: string | null;
                createdAt: Date;
                updatedAt: Date;
                replyTo: {
                    id: string;
                    kind: "QUESTION" | "TRACKING" | "REPLY";
                    body?: string | null;
                    payload: {
                        sections?: {
                            alimentacion?: string;
                            suplementos?: string;
                            actividadFisica?: string;
                        };
                        source?: "patient" | "nutritionist";
                    };
                    replyToId?: string | null;
                    createdAt: Date;
                    updatedAt: Date;
                } | null;
                replies: Array<{
                    id: string;
                    kind: "QUESTION" | "TRACKING" | "REPLY";
                    body?: string | null;
                    payload: {
                        sections?: {
                            alimentacion?: string;
                            suplementos?: string;
                            actividadFisica?: string;
                        };
                        source?: "patient" | "nutritionist";
                    };
                    replyToId?: string | null;
                    createdAt: Date;
                    updatedAt: Date;
                }>;
            }[];
            questions: {
                id: string;
                kind: "QUESTION" | "TRACKING" | "REPLY";
                body?: string | null;
                payload: {
                    sections?: {
                        alimentacion?: string;
                        suplementos?: string;
                        actividadFisica?: string;
                    };
                    source?: "patient" | "nutritionist";
                };
                replyToId?: string | null;
                createdAt: Date;
                updatedAt: Date;
                replyTo: {
                    id: string;
                    kind: "QUESTION" | "TRACKING" | "REPLY";
                    body?: string | null;
                    payload: {
                        sections?: {
                            alimentacion?: string;
                            suplementos?: string;
                            actividadFisica?: string;
                        };
                        source?: "patient" | "nutritionist";
                    };
                    replyToId?: string | null;
                    createdAt: Date;
                    updatedAt: Date;
                } | null;
                replies: Array<{
                    id: string;
                    kind: "QUESTION" | "TRACKING" | "REPLY";
                    body?: string | null;
                    payload: {
                        sections?: {
                            alimentacion?: string;
                            suplementos?: string;
                            actividadFisica?: string;
                        };
                        source?: "patient" | "nutritionist";
                    };
                    replyToId?: string | null;
                    createdAt: Date;
                    updatedAt: Date;
                }>;
            }[];
            tracking: {
                id: string;
                kind: "QUESTION" | "TRACKING" | "REPLY";
                body?: string | null;
                payload: {
                    sections?: {
                        alimentacion?: string;
                        suplementos?: string;
                        actividadFisica?: string;
                    };
                    source?: "patient" | "nutritionist";
                };
                replyToId?: string | null;
                createdAt: Date;
                updatedAt: Date;
                replyTo: {
                    id: string;
                    kind: "QUESTION" | "TRACKING" | "REPLY";
                    body?: string | null;
                    payload: {
                        sections?: {
                            alimentacion?: string;
                            suplementos?: string;
                            actividadFisica?: string;
                        };
                        source?: "patient" | "nutritionist";
                    };
                    replyToId?: string | null;
                    createdAt: Date;
                    updatedAt: Date;
                } | null;
                replies: Array<{
                    id: string;
                    kind: "QUESTION" | "TRACKING" | "REPLY";
                    body?: string | null;
                    payload: {
                        sections?: {
                            alimentacion?: string;
                            suplementos?: string;
                            actividadFisica?: string;
                        };
                        source?: "patient" | "nutritionist";
                    };
                    replyToId?: string | null;
                    createdAt: Date;
                    updatedAt: Date;
                }>;
            }[];
            replies: {
                id: string;
                kind: "QUESTION" | "TRACKING" | "REPLY";
                body?: string | null;
                payload: {
                    sections?: {
                        alimentacion?: string;
                        suplementos?: string;
                        actividadFisica?: string;
                    };
                    source?: "patient" | "nutritionist";
                };
                replyToId?: string | null;
                createdAt: Date;
                updatedAt: Date;
                replyTo: {
                    id: string;
                    kind: "QUESTION" | "TRACKING" | "REPLY";
                    body?: string | null;
                    payload: {
                        sections?: {
                            alimentacion?: string;
                            suplementos?: string;
                            actividadFisica?: string;
                        };
                        source?: "patient" | "nutritionist";
                    };
                    replyToId?: string | null;
                    createdAt: Date;
                    updatedAt: Date;
                } | null;
                replies: Array<{
                    id: string;
                    kind: "QUESTION" | "TRACKING" | "REPLY";
                    body?: string | null;
                    payload: {
                        sections?: {
                            alimentacion?: string;
                            suplementos?: string;
                            actividadFisica?: string;
                        };
                        source?: "patient" | "nutritionist";
                    };
                    replyToId?: string | null;
                    createdAt: Date;
                    updatedAt: Date;
                }>;
            }[];
        };
    }>;
    createTracking(req: any, dto: CreatePatientPortalEntryDto): Promise<{
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
                activeInvitation: {
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
                latestEntryAt: Date;
                daysSinceLastEntry: number | null;
                sectionCounts: {
                    alimentacion: number;
                    suplementos: number;
                    actividadFisica: number;
                };
                alerts: string[];
            };
            entries: {
                id: string;
                kind: "QUESTION" | "TRACKING" | "REPLY";
                body?: string | null;
                payload: {
                    sections?: {
                        alimentacion?: string;
                        suplementos?: string;
                        actividadFisica?: string;
                    };
                    source?: "patient" | "nutritionist";
                };
                replyToId?: string | null;
                createdAt: Date;
                updatedAt: Date;
                replyTo: {
                    id: string;
                    kind: "QUESTION" | "TRACKING" | "REPLY";
                    body?: string | null;
                    payload: {
                        sections?: {
                            alimentacion?: string;
                            suplementos?: string;
                            actividadFisica?: string;
                        };
                        source?: "patient" | "nutritionist";
                    };
                    replyToId?: string | null;
                    createdAt: Date;
                    updatedAt: Date;
                } | null;
                replies: Array<{
                    id: string;
                    kind: "QUESTION" | "TRACKING" | "REPLY";
                    body?: string | null;
                    payload: {
                        sections?: {
                            alimentacion?: string;
                            suplementos?: string;
                            actividadFisica?: string;
                        };
                        source?: "patient" | "nutritionist";
                    };
                    replyToId?: string | null;
                    createdAt: Date;
                    updatedAt: Date;
                }>;
            }[];
            questions: {
                id: string;
                kind: "QUESTION" | "TRACKING" | "REPLY";
                body?: string | null;
                payload: {
                    sections?: {
                        alimentacion?: string;
                        suplementos?: string;
                        actividadFisica?: string;
                    };
                    source?: "patient" | "nutritionist";
                };
                replyToId?: string | null;
                createdAt: Date;
                updatedAt: Date;
                replyTo: {
                    id: string;
                    kind: "QUESTION" | "TRACKING" | "REPLY";
                    body?: string | null;
                    payload: {
                        sections?: {
                            alimentacion?: string;
                            suplementos?: string;
                            actividadFisica?: string;
                        };
                        source?: "patient" | "nutritionist";
                    };
                    replyToId?: string | null;
                    createdAt: Date;
                    updatedAt: Date;
                } | null;
                replies: Array<{
                    id: string;
                    kind: "QUESTION" | "TRACKING" | "REPLY";
                    body?: string | null;
                    payload: {
                        sections?: {
                            alimentacion?: string;
                            suplementos?: string;
                            actividadFisica?: string;
                        };
                        source?: "patient" | "nutritionist";
                    };
                    replyToId?: string | null;
                    createdAt: Date;
                    updatedAt: Date;
                }>;
            }[];
            tracking: {
                id: string;
                kind: "QUESTION" | "TRACKING" | "REPLY";
                body?: string | null;
                payload: {
                    sections?: {
                        alimentacion?: string;
                        suplementos?: string;
                        actividadFisica?: string;
                    };
                    source?: "patient" | "nutritionist";
                };
                replyToId?: string | null;
                createdAt: Date;
                updatedAt: Date;
                replyTo: {
                    id: string;
                    kind: "QUESTION" | "TRACKING" | "REPLY";
                    body?: string | null;
                    payload: {
                        sections?: {
                            alimentacion?: string;
                            suplementos?: string;
                            actividadFisica?: string;
                        };
                        source?: "patient" | "nutritionist";
                    };
                    replyToId?: string | null;
                    createdAt: Date;
                    updatedAt: Date;
                } | null;
                replies: Array<{
                    id: string;
                    kind: "QUESTION" | "TRACKING" | "REPLY";
                    body?: string | null;
                    payload: {
                        sections?: {
                            alimentacion?: string;
                            suplementos?: string;
                            actividadFisica?: string;
                        };
                        source?: "patient" | "nutritionist";
                    };
                    replyToId?: string | null;
                    createdAt: Date;
                    updatedAt: Date;
                }>;
            }[];
            replies: {
                id: string;
                kind: "QUESTION" | "TRACKING" | "REPLY";
                body?: string | null;
                payload: {
                    sections?: {
                        alimentacion?: string;
                        suplementos?: string;
                        actividadFisica?: string;
                    };
                    source?: "patient" | "nutritionist";
                };
                replyToId?: string | null;
                createdAt: Date;
                updatedAt: Date;
                replyTo: {
                    id: string;
                    kind: "QUESTION" | "TRACKING" | "REPLY";
                    body?: string | null;
                    payload: {
                        sections?: {
                            alimentacion?: string;
                            suplementos?: string;
                            actividadFisica?: string;
                        };
                        source?: "patient" | "nutritionist";
                    };
                    replyToId?: string | null;
                    createdAt: Date;
                    updatedAt: Date;
                } | null;
                replies: Array<{
                    id: string;
                    kind: "QUESTION" | "TRACKING" | "REPLY";
                    body?: string | null;
                    payload: {
                        sections?: {
                            alimentacion?: string;
                            suplementos?: string;
                            actividadFisica?: string;
                        };
                        source?: "patient" | "nutritionist";
                    };
                    replyToId?: string | null;
                    createdAt: Date;
                    updatedAt: Date;
                }>;
            }[];
        };
    }>;
    createTrackingAlias(req: any, dto: CreatePatientPortalEntryDto): Promise<{
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
                activeInvitation: {
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
                latestEntryAt: Date;
                daysSinceLastEntry: number | null;
                sectionCounts: {
                    alimentacion: number;
                    suplementos: number;
                    actividadFisica: number;
                };
                alerts: string[];
            };
            entries: {
                id: string;
                kind: "QUESTION" | "TRACKING" | "REPLY";
                body?: string | null;
                payload: {
                    sections?: {
                        alimentacion?: string;
                        suplementos?: string;
                        actividadFisica?: string;
                    };
                    source?: "patient" | "nutritionist";
                };
                replyToId?: string | null;
                createdAt: Date;
                updatedAt: Date;
                replyTo: {
                    id: string;
                    kind: "QUESTION" | "TRACKING" | "REPLY";
                    body?: string | null;
                    payload: {
                        sections?: {
                            alimentacion?: string;
                            suplementos?: string;
                            actividadFisica?: string;
                        };
                        source?: "patient" | "nutritionist";
                    };
                    replyToId?: string | null;
                    createdAt: Date;
                    updatedAt: Date;
                } | null;
                replies: Array<{
                    id: string;
                    kind: "QUESTION" | "TRACKING" | "REPLY";
                    body?: string | null;
                    payload: {
                        sections?: {
                            alimentacion?: string;
                            suplementos?: string;
                            actividadFisica?: string;
                        };
                        source?: "patient" | "nutritionist";
                    };
                    replyToId?: string | null;
                    createdAt: Date;
                    updatedAt: Date;
                }>;
            }[];
            questions: {
                id: string;
                kind: "QUESTION" | "TRACKING" | "REPLY";
                body?: string | null;
                payload: {
                    sections?: {
                        alimentacion?: string;
                        suplementos?: string;
                        actividadFisica?: string;
                    };
                    source?: "patient" | "nutritionist";
                };
                replyToId?: string | null;
                createdAt: Date;
                updatedAt: Date;
                replyTo: {
                    id: string;
                    kind: "QUESTION" | "TRACKING" | "REPLY";
                    body?: string | null;
                    payload: {
                        sections?: {
                            alimentacion?: string;
                            suplementos?: string;
                            actividadFisica?: string;
                        };
                        source?: "patient" | "nutritionist";
                    };
                    replyToId?: string | null;
                    createdAt: Date;
                    updatedAt: Date;
                } | null;
                replies: Array<{
                    id: string;
                    kind: "QUESTION" | "TRACKING" | "REPLY";
                    body?: string | null;
                    payload: {
                        sections?: {
                            alimentacion?: string;
                            suplementos?: string;
                            actividadFisica?: string;
                        };
                        source?: "patient" | "nutritionist";
                    };
                    replyToId?: string | null;
                    createdAt: Date;
                    updatedAt: Date;
                }>;
            }[];
            tracking: {
                id: string;
                kind: "QUESTION" | "TRACKING" | "REPLY";
                body?: string | null;
                payload: {
                    sections?: {
                        alimentacion?: string;
                        suplementos?: string;
                        actividadFisica?: string;
                    };
                    source?: "patient" | "nutritionist";
                };
                replyToId?: string | null;
                createdAt: Date;
                updatedAt: Date;
                replyTo: {
                    id: string;
                    kind: "QUESTION" | "TRACKING" | "REPLY";
                    body?: string | null;
                    payload: {
                        sections?: {
                            alimentacion?: string;
                            suplementos?: string;
                            actividadFisica?: string;
                        };
                        source?: "patient" | "nutritionist";
                    };
                    replyToId?: string | null;
                    createdAt: Date;
                    updatedAt: Date;
                } | null;
                replies: Array<{
                    id: string;
                    kind: "QUESTION" | "TRACKING" | "REPLY";
                    body?: string | null;
                    payload: {
                        sections?: {
                            alimentacion?: string;
                            suplementos?: string;
                            actividadFisica?: string;
                        };
                        source?: "patient" | "nutritionist";
                    };
                    replyToId?: string | null;
                    createdAt: Date;
                    updatedAt: Date;
                }>;
            }[];
            replies: {
                id: string;
                kind: "QUESTION" | "TRACKING" | "REPLY";
                body?: string | null;
                payload: {
                    sections?: {
                        alimentacion?: string;
                        suplementos?: string;
                        actividadFisica?: string;
                    };
                    source?: "patient" | "nutritionist";
                };
                replyToId?: string | null;
                createdAt: Date;
                updatedAt: Date;
                replyTo: {
                    id: string;
                    kind: "QUESTION" | "TRACKING" | "REPLY";
                    body?: string | null;
                    payload: {
                        sections?: {
                            alimentacion?: string;
                            suplementos?: string;
                            actividadFisica?: string;
                        };
                        source?: "patient" | "nutritionist";
                    };
                    replyToId?: string | null;
                    createdAt: Date;
                    updatedAt: Date;
                } | null;
                replies: Array<{
                    id: string;
                    kind: "QUESTION" | "TRACKING" | "REPLY";
                    body?: string | null;
                    payload: {
                        sections?: {
                            alimentacion?: string;
                            suplementos?: string;
                            actividadFisica?: string;
                        };
                        source?: "patient" | "nutritionist";
                    };
                    replyToId?: string | null;
                    createdAt: Date;
                    updatedAt: Date;
                }>;
            }[];
        };
    }>;
    createReply(req: any, patientId: string, dto: CreatePatientPortalReplyDto): Promise<{
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
                activeInvitation: {
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
                latestEntryAt: Date;
                daysSinceLastEntry: number | null;
                sectionCounts: {
                    alimentacion: number;
                    suplementos: number;
                    actividadFisica: number;
                };
                alerts: string[];
            };
            entries: {
                id: string;
                kind: "QUESTION" | "TRACKING" | "REPLY";
                body?: string | null;
                payload: {
                    sections?: {
                        alimentacion?: string;
                        suplementos?: string;
                        actividadFisica?: string;
                    };
                    source?: "patient" | "nutritionist";
                };
                replyToId?: string | null;
                createdAt: Date;
                updatedAt: Date;
                replyTo: {
                    id: string;
                    kind: "QUESTION" | "TRACKING" | "REPLY";
                    body?: string | null;
                    payload: {
                        sections?: {
                            alimentacion?: string;
                            suplementos?: string;
                            actividadFisica?: string;
                        };
                        source?: "patient" | "nutritionist";
                    };
                    replyToId?: string | null;
                    createdAt: Date;
                    updatedAt: Date;
                } | null;
                replies: Array<{
                    id: string;
                    kind: "QUESTION" | "TRACKING" | "REPLY";
                    body?: string | null;
                    payload: {
                        sections?: {
                            alimentacion?: string;
                            suplementos?: string;
                            actividadFisica?: string;
                        };
                        source?: "patient" | "nutritionist";
                    };
                    replyToId?: string | null;
                    createdAt: Date;
                    updatedAt: Date;
                }>;
            }[];
            questions: {
                id: string;
                kind: "QUESTION" | "TRACKING" | "REPLY";
                body?: string | null;
                payload: {
                    sections?: {
                        alimentacion?: string;
                        suplementos?: string;
                        actividadFisica?: string;
                    };
                    source?: "patient" | "nutritionist";
                };
                replyToId?: string | null;
                createdAt: Date;
                updatedAt: Date;
                replyTo: {
                    id: string;
                    kind: "QUESTION" | "TRACKING" | "REPLY";
                    body?: string | null;
                    payload: {
                        sections?: {
                            alimentacion?: string;
                            suplementos?: string;
                            actividadFisica?: string;
                        };
                        source?: "patient" | "nutritionist";
                    };
                    replyToId?: string | null;
                    createdAt: Date;
                    updatedAt: Date;
                } | null;
                replies: Array<{
                    id: string;
                    kind: "QUESTION" | "TRACKING" | "REPLY";
                    body?: string | null;
                    payload: {
                        sections?: {
                            alimentacion?: string;
                            suplementos?: string;
                            actividadFisica?: string;
                        };
                        source?: "patient" | "nutritionist";
                    };
                    replyToId?: string | null;
                    createdAt: Date;
                    updatedAt: Date;
                }>;
            }[];
            tracking: {
                id: string;
                kind: "QUESTION" | "TRACKING" | "REPLY";
                body?: string | null;
                payload: {
                    sections?: {
                        alimentacion?: string;
                        suplementos?: string;
                        actividadFisica?: string;
                    };
                    source?: "patient" | "nutritionist";
                };
                replyToId?: string | null;
                createdAt: Date;
                updatedAt: Date;
                replyTo: {
                    id: string;
                    kind: "QUESTION" | "TRACKING" | "REPLY";
                    body?: string | null;
                    payload: {
                        sections?: {
                            alimentacion?: string;
                            suplementos?: string;
                            actividadFisica?: string;
                        };
                        source?: "patient" | "nutritionist";
                    };
                    replyToId?: string | null;
                    createdAt: Date;
                    updatedAt: Date;
                } | null;
                replies: Array<{
                    id: string;
                    kind: "QUESTION" | "TRACKING" | "REPLY";
                    body?: string | null;
                    payload: {
                        sections?: {
                            alimentacion?: string;
                            suplementos?: string;
                            actividadFisica?: string;
                        };
                        source?: "patient" | "nutritionist";
                    };
                    replyToId?: string | null;
                    createdAt: Date;
                    updatedAt: Date;
                }>;
            }[];
            replies: {
                id: string;
                kind: "QUESTION" | "TRACKING" | "REPLY";
                body?: string | null;
                payload: {
                    sections?: {
                        alimentacion?: string;
                        suplementos?: string;
                        actividadFisica?: string;
                    };
                    source?: "patient" | "nutritionist";
                };
                replyToId?: string | null;
                createdAt: Date;
                updatedAt: Date;
                replyTo: {
                    id: string;
                    kind: "QUESTION" | "TRACKING" | "REPLY";
                    body?: string | null;
                    payload: {
                        sections?: {
                            alimentacion?: string;
                            suplementos?: string;
                            actividadFisica?: string;
                        };
                        source?: "patient" | "nutritionist";
                    };
                    replyToId?: string | null;
                    createdAt: Date;
                    updatedAt: Date;
                } | null;
                replies: Array<{
                    id: string;
                    kind: "QUESTION" | "TRACKING" | "REPLY";
                    body?: string | null;
                    payload: {
                        sections?: {
                            alimentacion?: string;
                            suplementos?: string;
                            actividadFisica?: string;
                        };
                        source?: "patient" | "nutritionist";
                    };
                    replyToId?: string | null;
                    createdAt: Date;
                    updatedAt: Date;
                }>;
            }[];
        };
    }>;
    setAccessStatus(req: any, patientId: string, body: {
        status: 'ACTIVE' | 'BLOCKED';
    }): Promise<{
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
                activeInvitation: {
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
                latestEntryAt: Date;
                daysSinceLastEntry: number | null;
                sectionCounts: {
                    alimentacion: number;
                    suplementos: number;
                    actividadFisica: number;
                };
                alerts: string[];
            };
            entries: {
                id: string;
                kind: "QUESTION" | "TRACKING" | "REPLY";
                body?: string | null;
                payload: {
                    sections?: {
                        alimentacion?: string;
                        suplementos?: string;
                        actividadFisica?: string;
                    };
                    source?: "patient" | "nutritionist";
                };
                replyToId?: string | null;
                createdAt: Date;
                updatedAt: Date;
                replyTo: {
                    id: string;
                    kind: "QUESTION" | "TRACKING" | "REPLY";
                    body?: string | null;
                    payload: {
                        sections?: {
                            alimentacion?: string;
                            suplementos?: string;
                            actividadFisica?: string;
                        };
                        source?: "patient" | "nutritionist";
                    };
                    replyToId?: string | null;
                    createdAt: Date;
                    updatedAt: Date;
                } | null;
                replies: Array<{
                    id: string;
                    kind: "QUESTION" | "TRACKING" | "REPLY";
                    body?: string | null;
                    payload: {
                        sections?: {
                            alimentacion?: string;
                            suplementos?: string;
                            actividadFisica?: string;
                        };
                        source?: "patient" | "nutritionist";
                    };
                    replyToId?: string | null;
                    createdAt: Date;
                    updatedAt: Date;
                }>;
            }[];
            questions: {
                id: string;
                kind: "QUESTION" | "TRACKING" | "REPLY";
                body?: string | null;
                payload: {
                    sections?: {
                        alimentacion?: string;
                        suplementos?: string;
                        actividadFisica?: string;
                    };
                    source?: "patient" | "nutritionist";
                };
                replyToId?: string | null;
                createdAt: Date;
                updatedAt: Date;
                replyTo: {
                    id: string;
                    kind: "QUESTION" | "TRACKING" | "REPLY";
                    body?: string | null;
                    payload: {
                        sections?: {
                            alimentacion?: string;
                            suplementos?: string;
                            actividadFisica?: string;
                        };
                        source?: "patient" | "nutritionist";
                    };
                    replyToId?: string | null;
                    createdAt: Date;
                    updatedAt: Date;
                } | null;
                replies: Array<{
                    id: string;
                    kind: "QUESTION" | "TRACKING" | "REPLY";
                    body?: string | null;
                    payload: {
                        sections?: {
                            alimentacion?: string;
                            suplementos?: string;
                            actividadFisica?: string;
                        };
                        source?: "patient" | "nutritionist";
                    };
                    replyToId?: string | null;
                    createdAt: Date;
                    updatedAt: Date;
                }>;
            }[];
            tracking: {
                id: string;
                kind: "QUESTION" | "TRACKING" | "REPLY";
                body?: string | null;
                payload: {
                    sections?: {
                        alimentacion?: string;
                        suplementos?: string;
                        actividadFisica?: string;
                    };
                    source?: "patient" | "nutritionist";
                };
                replyToId?: string | null;
                createdAt: Date;
                updatedAt: Date;
                replyTo: {
                    id: string;
                    kind: "QUESTION" | "TRACKING" | "REPLY";
                    body?: string | null;
                    payload: {
                        sections?: {
                            alimentacion?: string;
                            suplementos?: string;
                            actividadFisica?: string;
                        };
                        source?: "patient" | "nutritionist";
                    };
                    replyToId?: string | null;
                    createdAt: Date;
                    updatedAt: Date;
                } | null;
                replies: Array<{
                    id: string;
                    kind: "QUESTION" | "TRACKING" | "REPLY";
                    body?: string | null;
                    payload: {
                        sections?: {
                            alimentacion?: string;
                            suplementos?: string;
                            actividadFisica?: string;
                        };
                        source?: "patient" | "nutritionist";
                    };
                    replyToId?: string | null;
                    createdAt: Date;
                    updatedAt: Date;
                }>;
            }[];
            replies: {
                id: string;
                kind: "QUESTION" | "TRACKING" | "REPLY";
                body?: string | null;
                payload: {
                    sections?: {
                        alimentacion?: string;
                        suplementos?: string;
                        actividadFisica?: string;
                    };
                    source?: "patient" | "nutritionist";
                };
                replyToId?: string | null;
                createdAt: Date;
                updatedAt: Date;
                replyTo: {
                    id: string;
                    kind: "QUESTION" | "TRACKING" | "REPLY";
                    body?: string | null;
                    payload: {
                        sections?: {
                            alimentacion?: string;
                            suplementos?: string;
                            actividadFisica?: string;
                        };
                        source?: "patient" | "nutritionist";
                    };
                    replyToId?: string | null;
                    createdAt: Date;
                    updatedAt: Date;
                } | null;
                replies: Array<{
                    id: string;
                    kind: "QUESTION" | "TRACKING" | "REPLY";
                    body?: string | null;
                    payload: {
                        sections?: {
                            alimentacion?: string;
                            suplementos?: string;
                            actividadFisica?: string;
                        };
                        source?: "patient" | "nutritionist";
                    };
                    replyToId?: string | null;
                    createdAt: Date;
                    updatedAt: Date;
                }>;
            }[];
        };
    }>;
}
