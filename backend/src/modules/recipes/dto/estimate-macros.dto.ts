import { IsArray, ArrayMinSize, IsString } from 'class-validator';

export class EstimateMacrosDto {
  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  ingredientNames!: string[];
}
