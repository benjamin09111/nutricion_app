export interface Metric {
    label: string;
    value: string | number;
    unit?: string;
}

export interface Consultation {
    id: string;
    patientId: string;
    patientName: string;
    date: string;
    title: string;
    description: string;
    metrics?: Metric[];
}
