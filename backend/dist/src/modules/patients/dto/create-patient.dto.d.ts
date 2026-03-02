export declare class CreatePatientDto {
    fullName: string;
    email?: string;
    phone?: string;
    documentId?: string;
    birthDate?: string;
    gender?: string;
    height?: number;
    weight?: number;
    dietRestrictions?: string[];
    status?: string;
    clinicalSummary?: string;
    nutritionalFocus?: string;
    fitnessGoals?: string;
    tags?: string[];
    customVariables?: {
        key: string;
        label: string;
        unit: string;
    }[];
}
