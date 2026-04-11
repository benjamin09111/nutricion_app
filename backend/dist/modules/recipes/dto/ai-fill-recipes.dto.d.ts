declare class AiFillTargetsDto {
    calories: number;
    protein: number;
    carbs: number;
    fats: number;
}
declare class AiFillRulesDto {
    strictDietFoodsForMainMeals: boolean;
    allowSimpleSnackProductsOutsideDiet: boolean;
    maxMainIngredients: number;
    preferSimpleRecipes: boolean;
    preferCommonHouseholdMeals: boolean;
    fillOnlyEmptySlots: boolean;
}
declare class AiFillSlotDto {
    slotId: string;
    time: string;
    mealSection: string;
    label: string;
    isEmpty: boolean;
}
declare class AiFillDayDto {
    day: string;
    slots: AiFillSlotDto[];
}
declare class ExistingAssignmentDto {
    day: string;
    slotId: string;
    mealSection: string;
    title: string;
    mainIngredients: string[];
}
declare class AiFillPayloadDto {
    scope: 'day' | 'week';
    targets: AiFillTargetsDto;
    dietRestrictions: string[];
    preferredFoods: string[];
    avoidFoods: string[];
    nutritionistNotes?: string;
    allowedFoodsByDiet: string[];
    generalSnackFlexAllowed: boolean;
    rules: AiFillRulesDto;
    day?: string;
    slots?: AiFillSlotDto[];
    days?: AiFillDayDto[];
    existingAssignments: ExistingAssignmentDto[];
    recipeStyle: 'very-simple' | 'simple' | 'varied';
    timeStyle: 'quick' | 'normal';
}
export declare class AiFillRecipesDto {
    scope: 'day' | 'week';
    payload: AiFillPayloadDto;
}
export type AiFillPayload = AiFillPayloadDto;
export {};
