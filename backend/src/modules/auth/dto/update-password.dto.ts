import {
  IsNotEmpty,
  IsString,
  MinLength,
  Matches,
} from 'class-validator';
import { PASSWORD_MIN_LENGTH, PASSWORD_REGEX } from '../password-policy';

export class UpdatePasswordDto {
  @IsString()
  @IsNotEmpty({ message: 'La contraseña actual es requerida' })
  currentPassword: string;

  @IsString()
  @MinLength(PASSWORD_MIN_LENGTH, {
    message: `La nueva contraseña debe tener al menos ${PASSWORD_MIN_LENGTH} caracteres`,
  })
  @Matches(PASSWORD_REGEX.uppercase, {
    message: 'La nueva contraseña debe incluir al menos una letra mayúscula',
  })
  @Matches(PASSWORD_REGEX.lowercase, {
    message: 'La nueva contraseña debe incluir al menos una letra minúscula',
  })
  @Matches(PASSWORD_REGEX.number, {
    message: 'La nueva contraseña debe incluir al menos un número',
  })
  @Matches(PASSWORD_REGEX.special, {
    message: 'La nueva contraseña debe incluir al menos un carácter especial',
  })
  @Matches(PASSWORD_REGEX.noSpaces, {
    message: 'La nueva contraseña no debe contener espacios',
  })
  newPassword: string;
}
