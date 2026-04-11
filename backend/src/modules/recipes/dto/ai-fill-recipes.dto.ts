import { Type } from 'class-transformer';
import {
    IsArray,
    IsBoolean,
    IsIn,
    IsInt,
    IsObject,
    IsOptional,
    IsString,
    Max,
    Min,
    ValidateNested,
} from 'class-validator';

class AiFillTargetsDto {
    @IsInt()
    @Min(0)
    calories: number;

    @IsInt()
    @Min(0)
    protein: number;

    @IsInt()
    @Min(0)
    carbs: number;

    @IsInt()
    @Min(0)
    fats: number;
}

class AiFillRulesDto {
    @IsBoolean()
    strictDietFoodsForMainMeals: boolean;

    @IsBoolean()
    allowSimpleSnackProductsOutsideDiet: boolean;

    @IsInt()
    @Min(1)
    @Max(10)
    maxMainIngredients: number;

    @IsBoolean()
    preferSimpleRecipes: boolean;

    @IsBoolean()
    preferCommonHouseholdMeals: boolean;

    @IsBoolean()
    fillOnlyEmptySlots: boolean;
}

class AiFillSlotDto {
    @IsString()
    slotId: string;

    @IsString()
    time: string;

    @IsString()
    mealSection: string;

    @IsString()
    label: string;

    @IsBoolean()
    isEmpty: boolean;
}

class AiFillDayDto {
    @IsString()
    day: string;

    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => AiFillSlotDto)
    slots: AiFillSlotDto[];
}

class ExistingAssignmentDto {
    @IsString()
    day: string;

    @IsString()
    slotId: string;

    @IsString()
    mealSection: string;

    @IsString()
    title: string;

    @IsArray()
    @IsString({ each: true })
    mainIngredients: string[];
}

class AiFillPayloadDto {
    @IsIn(['day', 'week'])
    scope: 'day' | 'week';

    @ValidateNested()
    @Type(() => AiFillTargetsDto)
    targets: AiFillTargetsDto;

    @IsArray()
    @IsString({ each: true })
    dietRestrictions: string[];

    @IsArray()
    @IsString({ each: true })
    preferredFoods: string[];

    @IsArray()
    @IsString({ each: true })
    avoidFoods: string[];

    @IsString()
    @IsOptional()
    nutritionistNotes?: string;

    @IsArray()
    @IsString({ each: true })
    allowedFoodsByDiet: string[];

    @IsBoolean()
    generalSnackFlexAllowed: boolean;

    @ValidateNested()
    @Type(() => AiFillRulesDto)
    rules: AiFillRulesDto;

    @IsString()
    @IsOptional()
    day?: string;

    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => AiFillSlotDto)
    @IsOptional()
    slots?: AiFillSlotDto[];

    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => AiFillDayDto)
    @IsOptional()
    days?: AiFillDayDto[];

    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => ExistingAssignmentDto)
    existingAssignments: ExistingAssignmentDto[];

    @IsIn(['very-simple', 'simple', 'varied'])
    recipeStyle: 'very-simple' | 'simple' | 'varied';

    @IsIn(['quick', 'normal'])
    timeStyle: 'quick' | 'normal';
}

export class AiFillRecipesDto {
    @IsIn(['day', 'week'])
    scope: 'day' | 'week';

    @IsObject()
    @ValidateNested()
    @Type(() => AiFillPayloadDto)
    payload: AiFillPayloadDto;
}

export type AiFillPayload = AiFillPayloadDto;
