import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class UpdatePasswordDto {
    @IsString()
    @IsNotEmpty({ message: 'La contraseña actual es requerida' })
    currentPassword: string;

    @IsString()
    @MinLength(6, { message: 'La nueva contraseña debe tener al menos 6 caracteres' })
    newPassword: string;
}
