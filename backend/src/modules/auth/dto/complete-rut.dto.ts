import { IsNotEmpty, IsString } from 'class-validator';

export class CompleteRutDto {
  @IsString()
  @IsNotEmpty({ message: 'El RUT es requerido' })
  rut: string;
}
