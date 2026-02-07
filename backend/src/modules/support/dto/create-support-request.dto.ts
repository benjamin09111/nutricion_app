import { IsEmail, IsEnum, IsOptional, IsString } from 'class-validator';

export class CreateSupportRequestDto {
    @IsEmail()
    email: string;

    @IsString()
    @IsOptional()
    message?: string;

    @IsEnum(['PASSWORD_RESET', 'CONTACT', 'OTHER', 'FEEDBACK', 'COMPLAINT', 'IDEA'])
    type: 'PASSWORD_RESET' | 'CONTACT' | 'OTHER' | 'FEEDBACK' | 'COMPLAINT' | 'IDEA';

    @IsString()
    @IsOptional()
    subject?: string;
}
