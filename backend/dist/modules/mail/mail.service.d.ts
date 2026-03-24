import { MailerService } from '@nestjs-modules/mailer';
export declare class MailService {
    private readonly mailerService;
    constructor(mailerService: MailerService);
    sendWelcomeEmail(email: string, fullName: string, password: string, validAdminMessage?: string): Promise<void>;
    sendRegistrationConfirmation(email: string, fullName: string): Promise<void>;
    sendAdminNotification(requestData: any): Promise<void>;
    sendFeedback(data: {
        type: string;
        subject: string;
        message: string;
        fromEmail: string;
    }): Promise<void>;
    sendRejectionEmail(email: string, fullName: string, adminMessage?: string): Promise<void>;
    sendPasswordResetEmail(email: string, fullName: string, password: string): Promise<void>;
}
