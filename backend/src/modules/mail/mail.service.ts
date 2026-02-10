import { Injectable } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';

@Injectable()
export class MailService {
    constructor(private readonly mailerService: MailerService) { }

    async sendWelcomeEmail(email: string, fullName: string, password: string, validAdminMessage?: string): Promise<void> {
        try {
            await this.mailerService.sendMail({
                to: email,
                subject: '🌿 ¡Bienvenido a NutriSaaS! Tus credenciales de acceso',
                template: 'welcome', // template name without extension
                context: {
                    name: fullName,
                    email: email,
                    password: password,
                    loginUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
                    adminMessage: validAdminMessage || '',
                    year: new Date().getFullYear(),
                },
            });
            console.log(`✅ Correo de bienvenida enviado a: ${email}`);
        } catch (error) {
            console.error('❌ Error enviando correo de bienvenida:', error);
        }
    }

    async sendRegistrationConfirmation(email: string, fullName: string): Promise<void> {
        try {
            await this.mailerService.sendMail({
                to: email,
                subject: '✅ Recibimos tu solicitud - NutriSaaS',
                template: 'request-confirmation',
                context: {
                    name: fullName,
                    year: new Date().getFullYear(),
                },
            });
            console.log(`✅ Correo de confirmación enviado a: ${email}`);
        } catch (error) {
            console.error('❌ Error enviando confirmación de registro:', error);
        }
    }

    async sendAdminNotification(requestData: any): Promise<void> {
        const adminEmail = process.env.ADMIN_EMAIL || 'admin@nutrisaas.com';
        try {
            await this.mailerService.sendMail({
                to: adminEmail,
                subject: '🔔 Nueva Solicitud de Registro',
                template: 'admin-notification',
                context: {
                    fullName: requestData.fullName,
                    email: requestData.email,
                    phone: requestData.phone,
                    professionalId: requestData.professionalId,
                    specialty: requestData.specialty,
                    message: requestData.message,
                    year: new Date().getFullYear(),
                },
            });
            console.log(`✅ Notificación enviada al administrador (${adminEmail})`);
        } catch (error) {
            console.error('❌ Error enviando notificación al administrador:', error);
        }
    }

    async sendFeedback(data: { type: string; subject: string; message: string; fromEmail: string }): Promise<void> {
        const adminEmail = process.env.ADMIN_EMAIL || 'admin@nutrisaas.com';
        try {
            await this.mailerService.sendMail({
                to: adminEmail,
                subject: `💬 [${data.type}] ${data.subject}`,
                template: 'admin-notification',
                context: {
                    fullName: data.fromEmail.split('@')[0], // Extract part of email as name
                    email: data.fromEmail,
                    message: data.message,
                    specialty: `SOPORTE: ${data.type}`,
                    year: new Date().getFullYear(),
                },
            });
            console.log(`✅ Notificación de soporte enviada al admin (${adminEmail})`);
        } catch (error) {
            console.error('❌ Error enviando notificación de soporte:', error);
        }
    }

    async sendRejectionEmail(email: string, fullName: string, adminMessage?: string) {
        try {
            await this.mailerService.sendMail({
                to: email,
                subject: 'Actualización sobre tu solicitud - NutriSaaS',
                template: 'rejection',
                context: {
                    name: fullName,
                    adminMessage: adminMessage || '',
                    year: new Date().getFullYear(),
                },
            });
            console.log(`✅ Correo de rechazo enviado a: ${email}`);
        } catch (error) {
            console.error('❌ Error enviando correo de rechazo:', error);
        }
    }

    async sendPasswordResetEmail(email: string, fullName: string, password: string) {
        try {
            await this.mailerService.sendMail({
                to: email,
                subject: '🔑 Recuperación de Acceso - NutriSaaS',
                template: 'password-reset',
                context: {
                    name: fullName,
                    email: email,
                    password: password,
                    loginUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
                    year: new Date().getFullYear(),
                },
            });
            console.log(`✅ Correo de recuperación enviado a: ${email}`);
        } catch (error) {
            console.error('❌ Error enviando correo de recuperación:', error);
        }
    }
}
