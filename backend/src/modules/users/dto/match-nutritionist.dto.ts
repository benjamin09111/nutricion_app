import { IsOptional, IsString, IsBoolean } from 'class-validator';

export class MatchNutritionistDto {
  @IsOptional()
  @IsString()
  goal?: string;

  @IsOptional()
  @IsString()
  mode?: string;

  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  @IsString()
  timePreference?: string;

  @IsOptional()
  @IsString()
  insurance?: string;

  @IsOptional()
  @IsBoolean()
  smartSearch?: boolean;

  @IsOptional()
  @IsString()
  smartNotes?: string;
}

