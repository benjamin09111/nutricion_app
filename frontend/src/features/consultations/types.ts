export interface Metric {
  key?: string; // e.g. 'weight', 'body_fat'
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
  description?: string;
  metrics?: Metric[];
}
export interface ConsultationsResponse {
  data: Consultation[];
  meta: {
    total: number;
    page: number;
    lastPage: number;
  };
}
