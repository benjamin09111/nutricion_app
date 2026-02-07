import { MailerService } from '@nestjs-modules/mailer';
export declare class MailService {
    private mailerService;
    constructor(mailerService: MailerService);
    sendWelcomeEmail(email: string, fullName: string, password: string): Promise<void>;
    sendAdminNotification(requestData: any): Promise<void>;
    sendRegistrationConfirmation(email: string, fullName: string): Promise<void>;
    sendRegistrationApproved(email: string, fullName: string, tempPass: string): Promise<void>;
}
