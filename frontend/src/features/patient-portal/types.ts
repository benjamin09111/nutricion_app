export type PatientPortalEntryKind = "QUESTION" | "TRACKING" | "REPLY" | "NOTIFICATION";

export interface PatientPortalTrackingSections {
  entryDate?: string;
  alimentacion?: string;
  suplementos?: string;
  actividadFisica?: string;
}

export interface PatientPortalEntryPayload {
  source?: "patient" | "nutritionist";
  entryDate?: string;
  sections?: PatientPortalTrackingSections;
  notificationTitle?: string;
  notificationType?: "INFO" | "REMINDER" | "ALERT";
}

export interface PatientPortalEntry {
  id: string;
  kind: PatientPortalEntryKind;
  body?: string | null;
  payload: PatientPortalEntryPayload;
  replyToId?: string | null;
  createdAt: string;
  updatedAt: string;
  replyTo?: {
    id: string;
    kind: PatientPortalEntryKind;
    body?: string | null;
    payload: PatientPortalEntryPayload;
    replyToId?: string | null;
    createdAt: string;
    updatedAt: string;
  } | null;
  replies?: PatientPortalEntry[];
}

export interface PatientPortalSummary {
  totalEntries: number;
  questionsCount: number;
  trackingCount: number;
  repliesCount: number;
  pendingQuestions: number;
  latestEntryAt: string | null;
  daysSinceLastEntry: number | null;
  sectionCounts: {
    alimentacion: number;
    suplementos: number;
    actividadFisica: number;
  };
  notificationsCount?: number;
  alerts: string[];
}

export interface PatientPortalResource {
  id: string;
  title: string;
  content: string;
  category: string;
  tags: string[];
  isPublic: boolean;
  format: string;
  fileUrl?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PatientPortalDeliverable {
  id: string;
  name: string;
  type: string;
  format: string;
  content: Record<string, unknown> | unknown;
  metadata?: Record<string, unknown> | null;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface PatientPortalProject {
  id: string;
  name: string;
  description?: string | null;
  mode: string;
  status: string;
  updatedAt: string;
  activeDietCreation?: {
    id: string;
    name: string;
    type: string;
  } | null;
  activeRecipeCreation?: {
    id: string;
    name: string;
    type: string;
  } | null;
  activeDeliverableCreation?: {
    id: string;
    name: string;
    type: string;
  } | null;
}

export interface PatientPortalPatient {
  id: string;
  fullName: string;
  email?: string | null;
  phone?: string | null;
  documentId?: string | null;
  status?: string | null;
  weight?: number | null;
  height?: number | null;
  createdAt: string;
  nutritionist?: {
    id: string;
    fullName: string;
    avatarUrl?: string | null;
  };
  projects?: PatientPortalProject[];
}

export interface PatientPortalInvitationSummary {
  id: string;
  email?: string | null;
  expiresAt: string;
  status: string;
  accessCode?: string;
  lastSentAt?: string | null;
  verifiedAt?: string | null;
  revokedAt?: string | null;
  blockedAt?: string | null;
  resourceIds?: string[];
  deliverableCreationIds?: string[];
  createdAt: string;
}

export interface PatientPortalOverview {
  patient: PatientPortalPatient;
  portal: {
    activeInvitation: PatientPortalInvitationSummary | null;
    latestInvitation: PatientPortalInvitationSummary | null;
  };
  summary: PatientPortalSummary;
  entries: PatientPortalEntry[];
  questions: PatientPortalEntry[];
  tracking: PatientPortalEntry[];
  replies: PatientPortalEntry[];
  notifications: PatientPortalEntry[];
  sharedResources: PatientPortalResource[];
  sharedDeliverables: PatientPortalDeliverable[];
  status: string;
}

export interface PortalInviteResponse {
  invitation: {
    id: string;
    email?: string | null;
    expiresAt: string;
    createdAt: string;
    status: string;
  };
  shareUrl: string;
  expiresAt: string;
  accessCode: string;
}

export interface PortalVerificationResponse extends PatientPortalOverview {
  accessToken: string;
}
