import { IsArray, IsOptional, IsUUID } from 'class-validator';

export class UpdateGroupIngredientsDto {
  @IsArray()
  @IsUUID('4', { each: true })
  @IsOptional()
  ingredientIds?: string[];

  @IsArray()
  @IsUUID('4', { each: true })
  @IsOptional()
  recipeIds?: string[];
}
