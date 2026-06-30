export interface PatientIntakeLink {
  id: string;
  nutritionistId: string;
  tokenVersion?: number;
  status: 'ACTIVE' | 'DISABLED';
  expiresAt: string | null;
  createdAt: string;
  updatedAt: string;
  token?: string;
}

export interface PatientIntakeSubmission {
  id: string;
  linkId: string;
  nutritionistId: string;
  patientId: string | null;
  payload: IntakePayload;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  reviewedAt: string | null;
  reviewedBy: string | null;
  rejectReason: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface IntakePayload {
  fullName: string;
  email?: string;
  phone?: string;
  documentId?: string;
  birthDate?: string;
  gender?: string;
  height?: number;
  weight?: number;
  activityLevel?: string;
  nutritionalFocus?: string;
  fitnessGoals?: string;
  dietRestrictions?: string[];
  likes?: string;
}

export interface IntakeSubmissionsResponse {
  data: PatientIntakeSubmission[];
  meta: {
    total: number;
    pendingCount: number;
    page: number;
    lastPage: number;
  };
}

export interface IntakeLinkResponse {
  hasLink: boolean;
  status: 'ACTIVE' | 'DISABLED' | null;
  token?: string;
}

export interface IntakeSubmissionStats {
  pending: number;
  approved: number;
  rejected: number;
}
