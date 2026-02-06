import { Injectable } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';

@Injectable()
export class MailService {
    constructor(private mailerService: MailerService) { }

    async sendWelcomeEmail(email: string, fullName: string, password: string) {
        await this.mailerService.sendMail({
            to: email,
            subject: '🌿 ¡Bienvenido a NutriSaaS! Tus credenciales de acceso',
            template: 'welcome', // template name without extension
            context: {
                name: fullName,
                email: email,
                password: password,
                loginUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
                year: new Date().getFullYear(),
            },
        });
    }
}
