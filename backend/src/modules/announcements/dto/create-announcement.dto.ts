
import { IsString, IsNotEmpty, IsArray, IsOptional } from 'class-validator';

export class CreateAnnouncementDto {
    @IsString()
    @IsNotEmpty()
    title: string;

    @IsString()
    @IsNotEmpty()
    message: string;

    @IsString()
    @IsOptional()
    type?: string;

    @IsString()
    @IsOptional()
    link?: string;

    @IsArray()
    @IsOptional()
    @IsString({ each: true })
    targetRoles?: string[];
}
