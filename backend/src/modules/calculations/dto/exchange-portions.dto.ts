import { Type } from 'class-transformer';
import {
  IsNumber,
  IsOptional,
  IsString,
  Min,
  Max,
  MaxLength,
} from 'class-validator';

export class DetectExchangeDto {
  @IsString()
  @IsOptional()
  @MaxLength(100)
  category?: string;

  @IsString()
  @IsOptional()
  @MaxLength(150)
  name?: string;

  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  @Min(0)
  @Max(100)
  carbs?: number;

  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  @Min(0)
  @Max(100)
  protein?: number;

  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  @Min(0)
  @Max(100)
  fat?: number;
}

export class CalculateExchangeDto {
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(50000)
  grams: number;

  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  @Min(0)
  @Max(100)
  carbsPer100g?: number;

  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  @Min(0)
  @Max(100)
  proteinPer100g?: number;

  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  @Min(0)
  @Max(100)
  fatPer100g?: number;

  @IsString()
  @IsOptional()
  @MaxLength(80)
  profileId?: string;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  category?: string;

  @IsString()
  @IsOptional()
  @MaxLength(150)
  name?: string;
}

export class CalculateGramsDto {
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(500)
  targetPortions: number;

  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  @Min(0)
  @Max(100)
  carbsPer100g?: number;

  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  @Min(0)
  @Max(100)
  proteinPer100g?: number;

  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  @Min(0)
  @Max(100)
  fatPer100g?: number;

  @IsString()
  @IsOptional()
  @MaxLength(80)
  profileId?: string;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  category?: string;

  @IsString()
  @IsOptional()
  @MaxLength(150)
  name?: string;
}

export class SuggestExchangesDto {
  @Type(() => Number)
  @IsNumber()
  @Min(500)
  @Max(10000)
  calories: number;

  @Type(() => Number)
  @IsNumber()
  @Min(10)
  @Max(500)
  protein: number;

  @Type(() => Number)
  @IsNumber()
  @Min(10)
  @Max(1000)
  carbs: number;

  @Type(() => Number)
  @IsNumber()
  @Min(5)
  @Max(500)
  fats: number;
}
