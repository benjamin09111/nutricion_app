import { Metric } from '@/features/consultations';

export interface Patient {
    id: string;
    name: string;
    email: string;
    birthDate: string;
    gender: 'M' | 'F' | 'Other';
    contactInfo: string;
    status: 'Active' | 'Inactive';
    lastVisit?: string;
    // Chronobiology
    wakeUpTime?: string;
    sleepTime?: string;
    // Nutrition & Restrictions
    dietaryRestrictions?: string[];
    mealCount?: number;
    tastes?: string[];
    dislikes?: string[];
    // Physical Parameters
    weight?: number;
    height?: number;
    age?: number;
    targetProtein?: number;
    targetCalories?: number;
    fitnessGoals?: string[];
    // Optional initial consultation
    initialConsultationTitle?: string;
    initialConsultationDescription?: string;
    initialConsultationMetrics?: Metric[];
}
