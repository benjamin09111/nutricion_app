// Screening test type identifiers
export type ScreeningTestType = 'MNA' | 'NRS_2002' | 'MUST' | 'STRONGKIDS' | 'ATALAH';

// A single question option
export interface QuestionOption {
  value: number;
  label: string;
}

// A single question in a screening test
export interface ScreeningQuestion {
  id: string;
  label: string;
  options: QuestionOption[];
  defaultValue: number;
  /** Key of patient field that can auto-fill this question */
  autoFillKey?: string;
}

// A section/block grouping questions
export interface ScreeningSection {
  title: string;
  maxPoints: number;
  questions: ScreeningQuestion[];
}

// Result interpretation threshold
export interface ScoreThreshold {
  maxScore: number; // score < maxScore falls into this category
  category: string;
  color: string;
  isAlert: boolean;
  recommendation: string;
}

// Full test definition
export interface ScreeningTestDefinition {
  type: ScreeningTestType;
  name: string;
  shortName: string;
  description: string;
  targetAge: string;
  icon: string; // lucide icon name
  maxScore: number;
  sections: ScreeningSection[];
  thresholds: ScoreThreshold[]; // ordered ascending by maxScore
}

// Answers map: question id -> selected value
export type ScreeningTestAnswers = Record<string, number>;

// Computed result
export interface ScreeningTestResult {
  scores: Record<string, number>; // section title -> subtotal
  total: number;
  category: string;
  color: string;
  isAlert: boolean;
  recommendation: string;
}

// Content JSON stored in Creation
export interface ScreeningTestCreationContent {
  testType: ScreeningTestType;
  version: string;
  patientId: string | null;
  patientName: string;
  answers: ScreeningTestAnswers;
  scores: Record<string, number>;
  result: {
    total: number;
    category: string;
    color: string;
    isAlert: boolean;
    recommendation: string;
  };
  autoFilledFields: string[];
  appliedAt: string;
}

// Patient data shape for auto-fill
export interface PatientAutoFillData {
  id?: string;
  fullName?: string;
  weight?: number | null;
  height?: number | null;
  age?: number | null;
  birthDate?: string | null;
  gender?: string | null;
  bmi?: number | null;
  isPregnant?: boolean;
  pregnancyWeek?: number | null;
  calfCircumference?: number | null;
  armCircumference?: number | null;
  tricipitalFold?: number | null;
}
