import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsDateString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
  Validate,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';
import type { ValidationArguments } from 'class-validator';
import type { CalculationInputs, Gender, ActivityLevel, TmbFormula } from '../calculations.service';

@ValidatorConstraint({ name: 'macroPercentages', async: false })
class MacroPercentagesConstraint implements ValidatorConstraintInterface {
  validate(_: unknown, args: ValidationArguments) {
    const input = args.object as CalculateDto;
    const values = [input.carbPct, input.proteinPct, input.fatPct];
    const provided = values.filter((value) => value !== undefined && value !== null);
    return provided.length === 0 || (provided.length === 3 && Math.abs(provided.reduce((sum, value) => sum + value!, 0) - 100) < 0.001);
  }

  defaultMessage() {
    return 'carbPct, proteinPct y fatPct deben enviarse juntos y sumar 100';
  }
}

export class CalculateDto implements CalculationInputs {
  @IsEnum(['Masculino', 'Femenino', 'Otro'])
  @IsOptional()
  gender?: Gender;

  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(300)
  @IsOptional()
  weight?: number;

  @Type(() => Number)
  @IsNumber()
  @Min(30)
  @Max(250)
  @IsOptional()
  height?: number;

  @IsDateString()
  @IsOptional()
  birthDate?: string;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(120)
  @IsOptional()
  ageYears?: number;

  @IsEnum(['sedentario', 'ligero', 'moderado', 'activo', 'muy_activo'])
  @IsOptional()
  activityLevel?: ActivityLevel;

  @IsEnum(['mifflin-st-jeor', 'harris-benedict', 'oms-fao'])
  @IsOptional()
  tmbFormula?: TmbFormula;

  @Type(() => Number)
  @IsNumber()
  @Min(20)
  @Max(85)
  @IsOptional()
  kneeHeight?: number;

  @Type(() => Number)
  @IsNumber()
  @Min(10)
  @Max(60)
  @IsOptional()
  calfCircumference?: number;

  @Type(() => Number)
  @IsNumber()
  @Min(10)
  @Max(60)
  @IsOptional()
  armCircumference?: number;

  @Type(() => Number)
  @IsNumber()
  @Min(2)
  @Max(60)
  @IsOptional()
  subescapularFold?: number;

  @Type(() => Number)
  @IsNumber()
  @Min(2)
  @Max(60)
  @IsOptional()
  tricipitalFold?: number;

  @Type(() => Number)
  @IsNumber()
  @Min(2)
  @Max(60)
  @IsOptional()
  bicipitalFold?: number;

  @Type(() => Number)
  @IsNumber()
  @Min(2)
  @Max(60)
  @IsOptional()
  suprailiacoFold?: number;

  @Type(() => Number)
  @IsNumber()
  @Min(30)
  @Max(200)
  @IsOptional()
  waistCircumference?: number;

  @Type(() => Number)
  @IsNumber()
  @Min(30)
  @Max(200)
  @IsOptional()
  hipCircumference?: number;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(100)
  @Validate(MacroPercentagesConstraint)
  @IsOptional()
  carbPct?: number;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(100)
  @Validate(MacroPercentagesConstraint)
  @IsOptional()
  proteinPct?: number;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(100)
  @Validate(MacroPercentagesConstraint)
  @IsOptional()
  fatPct?: number;

  @Type(() => Number)
  @IsNumber()
  @Min(15)
  @Max(40)
  @IsOptional()
  targetBmi?: number;

  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(300)
  @IsOptional()
  usualWeight?: number;

  @Type(() => Number)
  @IsNumber()
  @Min(0.1)
  @Max(104)
  @IsOptional()
  weightLossPeriodWeeks?: number;

  @IsString()
  @IsOptional()
  proteinProfile?: string;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(50)
  @IsOptional()
  edemaPercent?: number;

  @IsBoolean()
  @IsOptional()
  useUsualWeightForRequirements?: boolean;

  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(42)
  @IsOptional()
  pregnancyWeek?: number;

  @IsBoolean()
  @IsOptional()
  isPregnant?: boolean;

  @IsBoolean()
  @IsOptional()
  isLactating?: boolean;

  @IsEnum(['exclusive', 'partial'])
  @IsOptional()
  lactationType?: 'exclusive' | 'partial';
}
