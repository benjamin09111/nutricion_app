import { IsString, IsNotEmpty, IsOptional, IsNumber, IsArray, ValidateNested, Min, IsBoolean } from 'class-validator';
import { Type } from 'class-transformer';

class RecipeIngredientDto {
    @IsString()
    @IsNotEmpty()
    ingredientId: string;

    @IsNumber()
    @Min(0)
    amount: number;

    @IsString()
    @IsNotEmpty()
    unit: string;

    @IsString()
    @IsOptional()
    brandSuggestion?: string;
}

export class CreateRecipeDto {
    @IsString()
    @IsNotEmpty()
    name: string;

    @IsString()
    @IsOptional()
    description?: string;

    @IsString()
    @IsOptional()
    preparation?: string;

    @IsNumber()
    @Min(1)
    portions: number;

    @IsNumber()
    @IsOptional()
    portionSize?: number;

    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => RecipeIngredientDto)
    @IsOptional()
    ingredients?: RecipeIngredientDto[];

    // Optional manual overrides for macros per portion
    @IsNumber()
    @IsOptional()
    calories?: number;

    @IsNumber()
    @IsOptional()
    proteins?: number;

    @IsNumber()
    @IsOptional()
    carbs?: number;

    @IsNumber()
    @IsOptional()
    lipids?: number;
}
