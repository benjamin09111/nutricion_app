import { IsEmail, IsNotEmpty, IsOptional, IsString, IsEnum } from 'class-validator';
import { UserRole } from '@prisma/client';

export class CreateAccountDto {
    @IsEmail({}, { message: 'El correo electrónico no es válido' })
    @IsNotEmpty({ message: 'El correo es requerido' })
    email: string;

    @IsString()
    @IsOptional()
    fullName?: string;

    @IsEnum(UserRole, { message: 'Rol inválido' })
    @IsOptional()
    role?: UserRole;
}
