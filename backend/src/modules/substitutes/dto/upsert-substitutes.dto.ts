import { IsDefined } from 'class-validator';

export class UpsertSubstitutesDto {
  @IsDefined({ message: 'El contenido de sustitutos es requerido.' })
  content: any;
}
