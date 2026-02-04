import { IsString, IsNotEmpty, IsNumber, IsOptional, IsArray, IsObject, IsBoolean } from 'class-validator';

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
    calories: number;

    @IsNumber()
    proteins: number;

    @IsNumber()
    carbs: number;

    @IsNumber()
    fats: number;

    @IsArray()
    @IsString({ each: true })
    @IsOptional()
    tags?: string[];

    @IsString()
    @IsOptional()
    ingredients?: string;

    @IsObject()
    @IsOptional()
    micros?: Record<string, any>;

    @IsObject()
    @IsOptional()
    serving?: Record<string, any>;

    @IsBoolean()
    @IsOptional()
    isPublic?: boolean;
}
