export declare class CreateSupportRequestDto {
    email: string;
    message?: string;
    type: 'PASSWORD_RESET' | 'CONTACT' | 'OTHER' | 'FEEDBACK' | 'COMPLAINT' | 'IDEA';
    subject?: string;
}
