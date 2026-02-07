import { IsString, IsNotEmpty, IsEmail, IsOptional, IsNumber, IsDateString, IsEnum } from 'class-validator';

export class CreatePatientDto {
    @IsNotEmpty({ message: 'El nombre completo es obligatorio' })
    @IsString()
    fullName: string;

    @IsOptional()
    @IsEmail({}, { message: 'El correo electrónico no es válido' })
    email?: string;

    @IsOptional()
    @IsString()
    phone?: string;

    @IsOptional()
    @IsString()
    documentId?: string;

    @IsOptional()
    @IsDateString({}, { message: 'La fecha de nacimiento debe ser válida (ISO 8601)' })
    birthDate?: string;

    @IsOptional()
    @IsString()
    gender?: string;

    // Anthropometry (Initial values)
    @IsOptional()
    @IsNumber({}, { message: 'La altura debe ser un número (cm)' })
    height?: number;

    @IsOptional()
    @IsNumber({}, { message: 'El peso debe ser un número (kg)' })
    weight?: number;
}
