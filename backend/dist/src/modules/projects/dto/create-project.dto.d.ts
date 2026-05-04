export declare class CreateProjectDto {
    name: string;
    description?: string;
    patientId?: string;
    mode?: 'CLINICAL' | 'GENERAL';
    status?: 'DRAFT' | 'ACTIVE' | 'ARCHIVED';
    activeDietCreationId?: string;
    activeRecipeCreationId?: string;
    activeCartCreationId?: string;
    activeDeliverableCreationId?: string;
    metadata?: Record<string, unknown>;
}
