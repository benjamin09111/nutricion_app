import {
  IsEmail,
  IsNotEmpty,
  IsString,
  MinLength,
  Matches,
} from 'class-validator';
import { PASSWORD_MIN_LENGTH, PASSWORD_REGEX } from '../password-policy';

export class RegisterDto {
  @IsEmail({}, { message: 'El correo electrónico no es válido' })
  @IsNotEmpty({ message: 'El correo es requerido' })
  email: string;

  @IsString({ message: 'El nombre debe ser texto' })
  @IsNotEmpty({ message: 'El nombre completo es requerido' })
  fullName: string;

  @IsString({ message: 'La contraseña debe ser texto' })
  @IsNotEmpty({ message: 'La contraseña es requerida' })
  @MinLength(PASSWORD_MIN_LENGTH, {
    message: `La contraseña debe tener al menos ${PASSWORD_MIN_LENGTH} caracteres`,
  })
  @Matches(PASSWORD_REGEX.uppercase, {
    message: 'La contraseña debe incluir al menos una letra mayúscula',
  })
  @Matches(PASSWORD_REGEX.lowercase, {
    message: 'La contraseña debe incluir al menos una letra minúscula',
  })
  @Matches(PASSWORD_REGEX.number, {
    message: 'La contraseña debe incluir al menos un número',
  })
  @Matches(PASSWORD_REGEX.special, {
    message: 'La contraseña debe incluir al menos un carácter especial',
  })
  @Matches(PASSWORD_REGEX.noSpaces, {
    message: 'La contraseña no debe contener espacios',
  })
  password: string;
}
