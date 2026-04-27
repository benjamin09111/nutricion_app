import { IsEmail, IsOptional, IsInt, Min } from 'class-validator';

export class CreatePatientPortalInvitationDto {
  @IsOptional()
  @IsEmail({}, { message: 'El correo del paciente no es válido' })
  email?: string;

  @IsOptional()
  @IsInt({ message: 'Los días de expiración deben ser un número entero' })
  @Min(1, { message: 'La invitación debe durar al menos 1 día' })
  expiresInDays?: number;
}
