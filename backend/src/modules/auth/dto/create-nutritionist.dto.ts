import { IsEmail, IsNotEmpty } from 'class-validator';

export class CreateNutritionistDto {
    @IsEmail({}, { message: 'El correo electrónico no es válido' })
    @IsNotEmpty({ message: 'El correo es requerido' })
    email: string;
}
