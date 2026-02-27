export declare class CreateExamDto {
    name: string;
    date: string;
    laboratory?: string;
    notes?: string;
    fileUrl?: string;
    results?: Record<string, {
        value: number;
        unit: string;
    }>;
}
