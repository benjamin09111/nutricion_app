declare class QuickAiExistingDishDto {
    title?: string;
    mealSection?: string;
}
declare class QuickAiPatientDto {
    fullName?: string;
    restrictions?: string[];
    likes?: string;
    healthTags?: string[];
    clinicalSummary?: string;
    nutritionalFocus?: string;
    fitnessGoals?: string;
    gender?: string;
    birthDate?: string;
    weight?: number;
    height?: number;
}
declare class QuickAiFillPayloadDto {
    dietName?: string;
    notes?: string;
    allowedFoodsMain?: string[];
    restrictedFoods?: string[];
    specialConsiderations?: string;
    referenceDishes?: string[];
    resources?: string[];
    patient?: QuickAiPatientDto;
    existingDishes?: QuickAiExistingDishDto[];
    desiredDishCount?: number;
}
export declare class QuickAiFillRecipesDto {
    payload: QuickAiFillPayloadDto;
}
export type QuickAiFillPayload = QuickAiFillPayloadDto;
export {};
