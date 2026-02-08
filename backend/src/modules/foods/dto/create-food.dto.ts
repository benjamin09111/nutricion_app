import { IsString, IsNotEmpty, IsNumber, IsOptional, IsArray, IsBoolean } from 'class-validator';

export class CreateFoodDto {
    @IsString()
    @IsNotEmpty()
    name: string;

    @IsString()
    @IsOptional()
    brand?: string;

    @IsString()
    @IsNotEmpty()
    category: string;

    @IsNumber()
    @IsOptional()
    price?: number;

    @IsString()
    @IsNotEmpty()
    unit: string;

    @IsNumber()
    @IsOptional()
    amount?: number;

    @IsNumber()
    calories: number;

    @IsNumber()
    proteins: number;

    @IsNumber()
    @IsOptional()
    lipids?: number;

    @IsNumber()
    carbs: number;

    @IsNumber()
    @IsOptional()
    sugars?: number;

    @IsNumber()
    @IsOptional()
    fiber?: number;

    @IsNumber()
    @IsOptional()
    sodium?: number;

    @IsArray()
    @IsString({ each: true })
    @IsOptional()
    tags?: string[];

    @IsString()
    @IsOptional()
    ingredients?: string;

    @IsBoolean()
    @IsOptional()
    isPublic?: boolean;
}
