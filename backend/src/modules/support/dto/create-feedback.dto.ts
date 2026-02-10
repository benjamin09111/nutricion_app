import { IsEnum, IsOptional, IsString } from 'class-validator';

// Similar to CreateSupportRequestDto but without strictly required email (email comes from JWT)
export class CreateFeedbackDto {
    @IsString()
    @IsOptional()
    message?: string;

    @IsEnum(['FEEDBACK', 'COMPLAINT', 'IDEA'])
    type: 'FEEDBACK' | 'COMPLAINT' | 'IDEA';

    @IsString()
    @IsOptional()
    subject?: string;
}
