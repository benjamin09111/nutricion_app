import {
  IsEmail,
  IsOptional,
  IsString,
  Length,
  MinLength,
  MaxLength,
  IsIn,
} from 'class-validator';

export class SendPortalInvitationEmailDto {
  @IsOptional()
  @IsEmail({}, { message: 'El correo electrónico no es válido.' })
  email?: string;
}

export class PortalLoginDto {
  @IsEmail({}, { message: 'El correo electrónico no es válido.' })
  email: string;

  @IsString()
  @Length(6, 6, { message: 'El código de acceso debe tener exactamente 6 caracteres.' })
  accessCode: string;
}

export class CreatePortalAdminMessageDto {
  @IsString()
  @MinLength(1, { message: 'El mensaje no puede estar vacío.' })
  @MaxLength(2000, { message: 'El mensaje no puede superar los 2000 caracteres.' })
  message: string;
}

export class SetPortalAccessStatusDto {
  @IsIn(['ACTIVE', 'BLOCKED'], {
    message: 'El estado debe ser ACTIVE o BLOCKED.',
  })
  status: 'ACTIVE' | 'BLOCKED';
}
