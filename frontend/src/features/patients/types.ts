export interface Patient {
    id: string;
    nutritionistId: string;
    fullName: string;
    email?: string;
    phone?: string;
    documentId?: string;
    birthDate?: string;
    gender?: string;
    height?: number;
    weight?: number;
    dietRestrictions?: string[]; // Stored as Json array in backend
    customVariables?: { key: string; label: string; unit: string }[];
    exams?: PatientExam[];
    createdAt: string;
    updatedAt: string;
    clinicalSummary?: string;
    nutritionalFocus?: string;
    fitnessGoals?: string;

    // UI specific/Legacy fields
    status?: 'Active' | 'Inactive';
    lastVisit?: string;
}

export interface ExamResultValue {
    value: number;
    unit: string;
}

export interface PatientExam {
    id: string;
    patientId: string;
    name: string;
    date: string;
    laboratory?: string;
    fileUrl?: string;
    notes?: string;
    results?: Record<string, ExamResultValue>;
    createdAt: string;
    updatedAt: string;
}

export interface PatientsResponse {
    data: Patient[];
    meta: {
        total: number;
        filteredTotal: number;
        activeCount: number;
        inactiveCount: number;
        page: number;
        lastPage: number;
    };
}
