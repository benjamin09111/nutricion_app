export type PatientPortalEntryKind = "QUESTION" | "TRACKING" | "REPLY";

export interface PatientPortalTrackingSections {
  alimentacion?: string;
  suplementos?: string;
  actividadFisica?: string;
}

export interface PatientPortalEntryPayload {
  source?: "patient" | "nutritionist";
  sections?: PatientPortalTrackingSections;
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
  alerts: string[];
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
