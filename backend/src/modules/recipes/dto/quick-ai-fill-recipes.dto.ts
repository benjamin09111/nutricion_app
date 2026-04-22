import { Type } from 'class-transformer';
import {
    IsArray,
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
    @Max(12)
    @IsOptional()
    desiredDishCount?: number;
}

export class QuickAiFillRecipesDto {
    @IsObject()
    @ValidateNested()
    @Type(() => QuickAiFillPayloadDto)
    payload: QuickAiFillPayloadDto;
}

export type QuickAiFillPayload = QuickAiFillPayloadDto;
