import { IsString, IsNotEmpty, IsOptional, IsArray, IsDateString, IsUUID } from 'class-validator';

export class CreateConsultationDto {
    @IsUUID()
    @IsNotEmpty()
    patientId: string;

    @IsDateString()
    @IsNotEmpty()
    date: string;

    @IsString()
    @IsNotEmpty()
    title: string;

    @IsString()
    @IsOptional()
    description?: string;

    @IsArray()
    @IsOptional()
    metrics?: any[];
}
