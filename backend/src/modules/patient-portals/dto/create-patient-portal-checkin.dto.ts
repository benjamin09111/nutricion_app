import {
  IsArray,
  IsDateString,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';

export class CreatePatientPortalCheckInDto {
  @IsOptional()
  @IsDateString({}, { message: 'La fecha del check-in debe ser válida' })
  checkInDate?: string;

  @IsOptional()
  @IsNumber({}, { message: 'El peso debe ser un número' })
  weight?: number;

  @IsOptional()
  @IsNumber({}, { message: 'El agua debe ser un número' })
  waterLiters?: number;

  @IsOptional()
  @IsNumber({}, { message: 'Los minutos de actividad deben ser un número' })
  activityMinutes?: number;

  @IsOptional()
  @IsString()
  mood?: string;

  @IsOptional()
  @IsString()
  energy?: string;

  @IsOptional()
  @IsString()
  hunger?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  symptoms?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  meals?: string[];

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  photos?: string[];
}
