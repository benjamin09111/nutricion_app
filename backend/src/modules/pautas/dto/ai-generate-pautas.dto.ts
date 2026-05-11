import { IsString, IsArray, IsOptional, IsNumber, ValidateNested } from 'class-validator';
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
}