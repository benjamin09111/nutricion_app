import { IsArray, IsUUID } from 'class-validator';

export class UpdateGroupIngredientsDto {
    @IsArray()
    @IsUUID('4', { each: true })
    ingredientIds: string[];
}
