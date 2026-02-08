import { IsString, IsNotEmpty, IsOptional, IsArray, IsUUID } from 'class-validator';

export class CreateIngredientGroupDto {
    @IsString()
    @IsNotEmpty()
    name: string;

    @IsString()
    @IsOptional()
    description?: string;

    @IsArray()
    @IsString({ each: true })
    @IsOptional()
    tags?: string[]; // Array of tag names to create/connect

    @IsArray()
    @IsOptional()
    ingredients?: {
        id: string;
        brandSuggestion?: string;
        amount?: number;
        unit?: string;
    }[];
}
