import { Type } from 'class-transformer';
import {
    IsArray,
    IsIn,
    IsInt,
    IsObject,
    IsOptional,
    IsString,
    Max,
    Min,
    ValidateNested,
} from 'class-validator';

class QuickAiExistingDishDto {
    @IsString()
    @IsOptional()
    title?: string;

    @IsString()
    @IsOptional()
    mealSection?: string;
}

class QuickAiMealTargetDto {
    @IsString()
    mealSection: string;

    @IsInt()
    @Min(1)
    @Max(14)
    count: number;
}

class QuickAiPatientDto {
    @IsString()
    @IsOptional()
    fullName?: string;

    @IsArray()
    @IsString({ each: true })
    @IsOptional()
    restrictions?: string[];

    @IsString()
    @IsOptional()
    likes?: string;

    @IsArray()
    @IsString({ each: true })
    @IsOptional()
    healthTags?: string[];

    @IsString()
    @IsOptional()
    clinicalSummary?: string;

    @IsString()
    @IsOptional()
    nutritionalFocus?: string;

    @IsString()
    @IsOptional()
    fitnessGoals?: string;

    @IsString()
    @IsOptional()
    gender?: string;

    @IsInt()
    @Min(0)
    @IsOptional()
    ageYears?: number;

    @IsString()
    @IsOptional()
    birthDate?: string;

    @IsOptional()
    weight?: number;

    @IsOptional()
    height?: number;
}

class QuickAiFillPayloadDto {
    @IsString()
    @IsOptional()
    dietName?: string;

    @IsString()
    @IsOptional()
    notes?: string;

    @IsArray()
    @IsString({ each: true })
    @IsOptional()
    allowedFoodsMain?: string[];

    @IsArray()
    @IsString({ each: true })
    @IsOptional()
    restrictedFoods?: string[];

    @IsString()
    @IsOptional()
    specialConsiderations?: string;

    @IsArray()
    @IsString({ each: true })
    @IsOptional()
    referenceDishes?: string[];

    @IsArray()
    @IsString({ each: true })
    @IsOptional()
    resources?: string[];

    @ValidateNested()
    @Type(() => QuickAiPatientDto)
    @IsOptional()
    patient?: QuickAiPatientDto;

    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => QuickAiExistingDishDto)
    @IsOptional()
    existingDishes?: QuickAiExistingDishDto[];

    @IsInt()
    @Min(1)
    @Max(60)
    @IsOptional()
    desiredDishCount?: number;

    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => QuickAiMealTargetDto)
    @IsOptional()
    mealSectionTargets?: QuickAiMealTargetDto[];

    @IsString()
    @IsIn(['single', 'weekly'])
    @IsOptional()
    generationMode?: 'single' | 'weekly';
}

export class QuickAiFillRecipesDto {
    @IsObject()
    @ValidateNested()
    @Type(() => QuickAiFillPayloadDto)
    payload: QuickAiFillPayloadDto;
}

export type QuickAiFillPayload = QuickAiFillPayloadDto;
