export interface PatientMeal {
  id: string;
  time: string;
  name: string;
  subtitle: string;
  foods: string[];
  portions: { label: string; count: number }[];
  nutriNote?: string;
  isConsumed: boolean;
  caloriesApprox: number;
}

export type PatientMoodKey = "energia" | "excelente" | "tranquila" | "cansada" | "ansiedad";

export interface PatientDiaryEntry {
  id: string;
  date: string;
  time: string;
  mood: PatientMoodKey;
  moodLabel: string;
  content: string;
  waterGlasses?: number;
}

export interface PatientDeliverableFile {
  id: string;
  title: string;
  category: "Pauta" | "Recetario" | "Guía" | "Lista de compras";
  updatedAt: string;
  pageCount: number;
  description: string;
  fileSize: string;
  downloadUrl?: string;
}

export interface PatientQnAItem {
  id: string;
  question: string;
  answer: string;
  askedAt: string;
  answeredAt?: string;
  isResolved: boolean;
}

export interface PatientResourceItem {
  id: string;
  title: string;
  category: string;
  readTimeMinutes: number;
  summary: string;
  keyTakeaways: string[];
  tags: string[];
}

export interface PatientNotification {
  id: string;
  title: string;
  message: string;
  timeAgo: string;
  type: "plan" | "streak" | "water" | "chat";
  isRead: boolean;
}

export interface PatientProfileState {
  fullName: string;
  nutriName: string;
  nutriSpecialty: string;
  targetObjective: string;
  currentStreakDays: number;
  totalStars: number;
  level: number;
  levelName: string;
  nextLevelStars: number;
  currentWeightKg: number;
  startingWeightKg: number;
  goalWeightKg: number;
  waterIntakeMl: number;
  waterGoalMl: number;
}
