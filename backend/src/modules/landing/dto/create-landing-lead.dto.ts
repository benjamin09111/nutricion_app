import { IsEmail, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateLandingLeadDto {
  @IsString()
  @IsNotEmpty({ message: 'El nombre completo es requerido' })
  @MaxLength(120)
  fullName: string;

  @IsEmail({}, { message: 'El correo electrónico no es válido' })
  @IsNotEmpty({ message: 'El correo electrónico es requerido' })
  @MaxLength(120)
  email: string;

  @IsString()
  @IsNotEmpty({ message: 'El área de ejercicio es requerida' })
  @MaxLength(60)
  practiceArea: string;

  @IsString()
  @IsOptional()
  @MaxLength(30)
  phone?: string;

  @IsString()
  @IsOptional()
  @MaxLength(60)
  source?: string;

  @IsString()
  @IsOptional()
  @MaxLength(500)
  notes?: string;
}
