import { IsString, IsNotEmpty, IsOptional, IsDateString, IsObject } from 'class-validator';

export class CreateExamDto {
    @IsString()
    @IsNotEmpty()
    name: string;

    @IsDateString()
    @IsNotEmpty()
    date: string;

    @IsString()
    @IsOptional()
    laboratory?: string;

    @IsString()
    @IsOptional()
    notes?: string;

    @IsString()
    @IsOptional()
    fileUrl?: string;

    @IsObject()
    @IsOptional()
    results?: Record<string, { value: number; unit: string }>;
}
