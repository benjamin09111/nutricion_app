import {
  IsString,
  IsNotEmpty,
  IsEmail,
  IsOptional,
  IsNumber,
  IsDateString,
  IsArray,
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
  @MaxLength(50)
  status?: string;

  @IsOptional()
  @IsString()
  honeypot?: string;
}
