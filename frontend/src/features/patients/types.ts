export interface Patient {
  id: string;
  nutritionistId: string;
  fullName: string;
  email?: string;
  phone?: string;
  documentId?: string;
  age?: number;
  birthDate?: string;
  gender?: string;
  height?: number;
  weight?: number;
  dietRestrictions?: string[]; // Stored as Json array in backend
  tags?: string[];
  customVariables?: {
    key: string;
    label: string;
    unit?: string;
    value?: string | number | boolean | Record<string, unknown> | string[];
  }[];
  exams?: PatientExam[];
  createdAt: string;
  updatedAt: string;
  clinicalSummary?: string;
  nutritionalFocus?: string;
  fitnessGoals?: string;
  likes?: string;
  dislikedFoods?: string[];
  activityLevel?: ActivityLevel;
  primaryCondition?: string;
  clinicalRecord?: ClinicalRecord | null;

  // UI specific/Legacy fields
  status?: "Active" | "Inactive";
  lastVisit?: string;
  projects?: PatientProject[];
}

export interface ClinicalRecord {
  id: string;
  patientId: string;
  vitalHistory?: {
    occupation?: string;
    workSchedule?: string;
    medications?: string;
    supplementsOrDrugs?: string;
    diagnosedPathologies?: string;
    familyHistory?: string;
    sleepQuality?: string;
    perceivedStress?: string;
    weeklyExercise?: string;
    motivoConsulta?: string;
    manualCaloriesAdjustment?: number;
    pesoObjetivoProf?: number;
  };
  gynecoObstetric?: {
    isPregnant?: boolean;
    pregnancyWeeks?: number;
    pregestationalWeight?: number;
    pregnancyType?: string;
  };
  nutritionalAnamnesis?: {
    eatingPreferences?: string;
    rejectedFoods?: string;
    clinicalObservations?: string;
    gestationalSymptoms?: string[];
    gestationalSupplementation?: string[];
    diagnosticoNutricional?: string;
  };
  anthropometry?: {
    skinfolds?: {
      tricipital?: number;
      bicipital?: number;
      subescapular?: number;
      suprailiac?: number;
    };
    circumferences?: {
      kneeHeight?: number;
      calfCircumference?: number;
      armCircumference?: number;
      waistCircumference?: number;
      hipCircumference?: number;
    };
    pesoHabitual?: number;
  };
  dataSources?: Record<string, "patient" | "nutritionist" | "calculated">;
  createdAt: string;
  updatedAt: string;
}

export type ActivityLevel = "sedentario" | "ligero" | "moderado" | "activo" | "muy_activo";

export interface PatientProject {
  id: string;
  name: string;
  description?: string | null;
  mode: string;
  status: string;
  updatedAt: string;
  activeDietCreation?: ProjectCreationSummary | null;
  activeRecipeCreation?: ProjectCreationSummary | null;
  activeDeliverableCreation?: ProjectCreationSummary | null;
}

export interface ProjectCreationSummary {
  id: string;
  name: string;
  type: string;
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
