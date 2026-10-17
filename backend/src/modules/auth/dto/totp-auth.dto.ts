import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class VerifyTotpLoginDto {
  @IsString({ message: 'El token temporal debe ser un texto' })
  @IsNotEmpty({ message: 'El token temporal es requerido' })
  tempToken: string;

  @IsString({ message: 'El código 2FA debe ser un texto' })
  @IsNotEmpty({ message: 'El código de verificación es requerido' })
  @MaxLength(20, { message: 'El código es demasiado largo' })
  code: string;
}

export class Confirm2faDto {
  @IsString({ message: 'El código debe ser un texto' })
  @IsNotEmpty({ message: 'El código de verificación es requerido' })
  @MaxLength(10, { message: 'El código debe tener como máximo 10 caracteres' })
  code: string;
}

export class Disable2faDto {
  @IsString({ message: 'La contraseña debe ser un texto' })
  @IsNotEmpty({ message: 'La contraseña actual es requerida' })
  password: string;
}
