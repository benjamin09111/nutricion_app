import { Injectable } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';

@Injectable()
export class MailService {
    constructor(private mailerService: MailerService) { }

    async sendWelcomeEmail(email: string, fullName: string, password: string) {
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
                    year: new Date().getFullYear(),
                },
            });
            console.log(`✅ Correo de bienvenida enviado a: ${email}`);
        } catch (error) {
            console.error('❌ Error enviando correo:', error);
            // In development, we don't want to block account creation if email fails
            if (process.env.NODE_ENV === 'production') {
                throw error;
            } else {
                console.log('⚠️ Continuando ejecución pese al error de correo (Modo Desarrollo)');
                console.log('-----------------------------------------------------------');
                console.log(`🔑 DATOS DEL USUARIO: ${email} / ${password}`);
                console.log('-----------------------------------------------------------');
            }
        }
    }
    async sendAdminNotification(requestData: any) {
        try {
            await this.mailerService.sendMail({
                to: process.env.MAIL_USER, // The admin email
                subject: '🔔 Nueva Solicitud de Registro Profesional',
                template: 'admin-notification',
                context: {
                    ...requestData,
                    year: new Date().getFullYear(),
                },
            });
        } catch (error) {
            console.error('❌ Error enviando notificación al admin:', error);
        }
    }

    async sendRegistrationConfirmation(email: string, fullName: string) {
        try {
            await this.mailerService.sendMail({
                to: email,
                subject: '📥 Hemos recibido tu solicitud - NutriSaaS',
                template: 'request-confirmation',
                context: {
                    name: fullName,
                    year: new Date().getFullYear(),
                },
            });
        } catch (error) {
            console.error('❌ Error enviando confirmación al usuario:', error);
        }
    }
    async sendRegistrationApproved(email: string, fullName: string, tempPass: string) {
        try {
            await this.mailerService.sendMail({
                to: email,
                subject: '✅ ¡Bienvenido a NutriSaaS!',
                template: 'registration-approved',
                context: {
                    name: fullName,
                    password: tempPass,
                    loginUrl: process.env.FRONTEND_URL ? `${process.env.FRONTEND_URL}/login` : 'http://localhost:3000/login',
                    year: new Date().getFullYear(),
                },
            });
        } catch (error) {
            console.error('❌ Error enviando credenciales:', error);
        }
    }


    async sendFeedback(data: { type: string; subject: string; message: string; fromEmail?: string }) {
        const adminEmail = process.env.MAIL_USER;
        try {
            await this.mailerService.sendMail({
                to: adminEmail,
                subject: `📢 Nuevo Feedback: [${data.type.toUpperCase()}] - ${data.subject}`,
                template: 'feedback',
                context: {
                    type: data.type.toUpperCase(),
                    subject: data.subject,
                    message: data.message,
                    fromEmail: data.fromEmail || 'Anónimo',
                    year: new Date().getFullYear(),
                },
                html: `
                    <h1>Nuevo Feedback Recibido</h1>
                    <p><strong>Tipo:</strong> ${data.type}</p>
                    <p><strong>Asunto:</strong> ${data.subject}</p>
                    <p><strong>De:</strong> ${data.fromEmail || 'Anónimo'}</p>
                    <hr />
                    <p>${data.message}</p>
                `
            });
            console.log(`✅ Feedback enviado al admin (${adminEmail})`);
        } catch (error) {
            console.error('❌ Error enviando feedback:', error);
        }
    }
}
