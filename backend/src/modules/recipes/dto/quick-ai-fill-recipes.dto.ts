import { Type } from 'class-transformer';
import {
  IsArray,
  IsIn,
  IsInt,
  IsObject,
  IsOptional,
  IsNumber,
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

  @Type(() => Number)
  @IsInt()
  @Min(0)
  @IsOptional()
  ageYears?: number;

  @IsString()
  @IsOptional()
  birthDate?: string;

  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  weight?: number;

  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  height?: number;

  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  bmi?: number;

  @IsString()
  @IsOptional()
  bmiClassification?: string;
}

class QuickAiNutritionalTargetsDto {
  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  dailyCalories?: number;

  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  dailyProtein?: number;

  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  dailyCarbs?: number;

  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  dailyFats?: number;

  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  tmb?: number;

  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  get?: number;

  @IsString()
  @IsOptional()
  activityLevel?: string;

  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  bmi?: number;

  @IsString()
  @IsOptional()
  bmiClassification?: string;

  @Type(() => Number)
  @IsInt()
  @Min(0)
  @IsOptional()
  ageYears?: number;
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

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  exchangeGuide?: string[];

  @ValidateNested()
  @Type(() => QuickAiPatientDto)
  @IsOptional()
  patient?: QuickAiPatientDto;

  @ValidateNested()
  @Type(() => QuickAiNutritionalTargetsDto)
  @IsOptional()
  nutritionalTargets?: QuickAiNutritionalTargetsDto;

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
