import { IsEmail, IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';

export class CreateRegistrationRequestDto {
    @IsNotEmpty({ message: 'El nombre es obligatorio' })
    @IsString()
    @MinLength(3, { message: 'El nombre debe tener al menos 3 caracteres' })
    fullName: string;

    @IsNotEmpty({ message: 'El correo es obligatorio' })
    @IsEmail({}, { message: 'Correo electrónico inválido' })
    email: string;

    @IsOptional()
    @IsString()
    phone?: string;

    @IsOptional()
    @IsString()
    professionalId?: string;

    @IsOptional()
    @IsString()
    specialty?: string;

    @IsOptional()
    @IsString()
    message?: string;
}
