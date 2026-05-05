import { IsString, IsArray, IsOptional } from 'class-validator';

export class CompatibleRecipesDto {
  @IsArray()
  @IsString({ each: true })
  ingredientNames: string[];

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  restrictions?: string[];
}
