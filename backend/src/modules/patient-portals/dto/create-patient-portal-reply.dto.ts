import { IsNotEmpty, IsString } from 'class-validator';

export class CreatePatientPortalReplyDto {
  @IsString()
  @IsNotEmpty({ message: 'El identificador de la pregunta es obligatorio' })
  questionId: string;

  @IsString()
  @IsNotEmpty({ message: 'Escribe un mensaje de respuesta' })
  message: string;
}
