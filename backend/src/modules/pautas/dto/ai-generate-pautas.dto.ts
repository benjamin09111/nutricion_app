import {
  IsString,
  IsArray,
  IsOptional,
  IsNumber,
  IsBoolean,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class PautaPatientDto {
  @IsOptional()
  @IsString()
  fullName?: string;

  @IsOptional()
  @IsNumber()
  ageYears?: number;

  @IsOptional()
  @IsNumber()
  weight?: number;

  @IsOptional()
  @IsNumber()
  height?: number;

  @IsOptional()
  @IsString()
  gender?: string;

  @IsOptional()
  @IsString()
  clinicalSummary?: string;

  @IsOptional()
  @IsString()
  likes?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  dislikedFoods?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  restrictions?: string[];

  @IsOptional()
  @IsString()
  primaryCondition?: string;

  @IsOptional()
  @IsString()
  nutritionalFocus?: string;

  @IsOptional()
  @IsString()
  fitnessGoals?: string;

  @IsOptional()
  @IsNumber()
  get?: number;
}

export class AiGeneratePautasDto {
  @IsString()
  restriction: string;

  @IsArray()
  @IsOptional()
  allowedFoods?: string[];

  @IsArray()
  @IsOptional()
  restrictedFoods?: string[];

  @IsArray()
  @IsString({ each: true })
  categories: string[];

  @IsOptional()
  @ValidateNested()
  @Type(() => PautaPatientDto)
  patient?: PautaPatientDto;

  @IsOptional()
  @IsBoolean()
  allowExternalFoods?: boolean;
}
