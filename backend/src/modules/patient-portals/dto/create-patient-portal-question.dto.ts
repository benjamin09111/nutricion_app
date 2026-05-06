import { IsNotEmpty, IsString } from 'class-validator';

export class CreatePatientPortalQuestionDto {
  @IsString()
  @IsNotEmpty({ message: 'Escribe tu pregunta o consulta' })
  message: string;
}
