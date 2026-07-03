import {
  IsString,
  IsNotEmpty,
  IsEmail,
  IsOptional,
  IsNumber,
  IsDateString,
  IsArray,
  IsBoolean,
  MinLength,
  MaxLength,
  Min,
  Max,
  IsIn,
} from 'class-validator';

export class SubmitIntakeFormDto {
  @IsNotEmpty({ message: 'El nombre completo es obligatorio' })
  @IsString()
  @MinLength(2, { message: 'El nombre debe tener al menos 2 caracteres' })
  @MaxLength(100, { message: 'El nombre no puede exceder 100 caracteres' })
  fullName: string;

  @IsOptional()
  @IsEmail({}, { message: 'El correo electrónico no es válido' })
  @MaxLength(255)
  email?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20, { message: 'El teléfono no puede exceder 20 caracteres' })
  phone?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20, { message: 'El documento no puede exceder 20 caracteres' })
  documentId?: string;

  @IsOptional()
  @IsDateString({}, { message: 'La fecha de nacimiento debe ser válida' })
  birthDate?: string;

  @IsOptional()
  @IsString()
  @IsIn(['Masculino', 'Femenino', 'Otro'], {
    message: 'El sexo biológico debe ser Masculino, Femenino u Otro',
  })
  gender?: string;

  @IsOptional()
  @IsNumber({}, { message: 'La altura debe ser un número' })
  @Min(50, { message: 'La altura debe ser al menos 50 cm' })
  @Max(300, { message: 'La altura no puede exceder 300 cm' })
  height?: number;

  @IsOptional()
  @IsNumber({}, { message: 'El peso debe ser un número' })
  @Min(10, { message: 'El peso debe ser al menos 10 kg' })
  @Max(700, { message: 'El peso no puede exceder 700 kg' })
  weight?: number;

  @IsOptional()
  @IsString()
  @IsIn(['sedentario', 'ligero', 'moderado', 'activo', 'muy_activo'], {
    message: 'Nivel de actividad inválido',
  })
  activityLevel?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  nutritionalFocus?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  fitnessGoals?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @MaxLength(20, { each: true })
  dietRestrictions?: string[];

  @IsOptional()
  @IsString()
  @MaxLength(500, {
    message: 'Las preferencias no pueden exceder 500 caracteres',
  })
  likes?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  occupation?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  workSchedule?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  medications?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  drugsSupplements?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  diagnosedPathologies?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  foodFrequency?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  recall24h?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  eatingPreferences?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  clinicalObservations?: string;

  @IsOptional()
  @IsBoolean()
  pregnant?: boolean;

  @IsOptional()
  @IsNumber({}, { message: 'Las semanas de gestación deben ser un número' })
  pregnancyWeeks?: number;

  @IsOptional()
  @IsNumber({}, { message: 'El peso pre-gestacional debe ser un número' })
  pregestationalWeight?: number;

  @IsOptional()
  @IsNumber({}, { message: 'La altura de rodilla debe ser un número' })
  kneeHeight?: number;

  @IsOptional()
  @IsNumber({}, { message: 'La circunferencia de pantorrilla debe ser un número' })
  calfCircumference?: number;

  @IsOptional()
  @IsNumber({}, { message: 'La circunferencia braquial debe ser un número' })
  armCircumference?: number;

  @IsOptional()
  @IsNumber({}, { message: 'La circunferencia de cintura debe ser un número' })
  waistCircumference?: number;

  @IsOptional()
  @IsNumber({}, { message: 'La circunferencia de cadera debe ser un número' })
  hipCircumference?: number;

  @IsOptional()
  @IsNumber({}, { message: 'El pliegue tricipital debe ser un número' })
  pliegueTricipital?: number;

  @IsOptional()
  @IsNumber({}, { message: 'El pliegue bicipital debe ser un número' })
  pliegueBicipital?: number;

  @IsOptional()
  @IsNumber({}, { message: 'El pliegue subescapular debe ser un número' })
  pliegueSubescapular?: number;

  @IsOptional()
  @IsNumber({}, { message: 'El pliegue suprailiaco debe ser un número' })
  pliegueSuprailiaco?: number;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  status?: string;

  @IsOptional()
  @IsString()
  honeypot?: string;
}
