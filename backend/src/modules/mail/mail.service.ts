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
                template: 'welcome',
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
                    fullName: data.fromEmail.split('@')[0],
                    email: data.fromEmail,
                    phone: 'N/A',
                    professionalId: 'N/A',
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

    async sendFeedbackConfirmation(email: string): Promise<void> {
        try {
            await this.mailerService.sendMail({
                to: email,
                subject: '💬 Recibimos tu feedback - NutriSaaS',
                template: 'request-confirmation',
                context: {
                    name: 'Usuario',
                    year: new Date().getFullYear(),
                },
            });
            console.log(`✅ Confirmación de feedback enviada a: ${email}`);
        } catch (error) {
            console.error('❌ Error enviando confirmación de feedback:', error);
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
            throw error;
        }
    }

    async sendPatientPortalInvitationEmail(data: {
      email: string;
      patientName: string;
      nutritionistName: string;
      shareUrl: string;
      expiresAt: Date;
      accessCode: string;
      }) {
        try {
            await this.mailerService.sendMail({
                to: data.email,
                subject: `Tu portal de seguimiento - ${data.nutritionistName}`,
                template: 'patient-portal-invitation',
                  context: {
                      patientName: data.patientName,
                      nutritionistName: data.nutritionistName,
                      shareUrl: data.shareUrl,
                      accessCode: data.accessCode,
                      expiresAt: data.expiresAt.toLocaleDateString('es-CL'),
                      year: new Date().getFullYear(),
                  },
            });
            console.log(`✅ Invitación de portal enviada a: ${data.email}`);
        } catch (error) {
            console.error('❌ Error enviando invitación de portal:', error);
        }
    }
    async sendPatientPortalNotificationEmail(data: {
      email: string;
      patientName: string;
      nutritionistName: string;
      title: string;
      message: string;
    }) {
        try {
            await this.mailerService.sendMail({
                to: data.email,
                subject: `${data.nutritionistName} te envió una notificación`,
                html: `
                  <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #0f172a;">
                    <h2 style="margin: 0 0 12px;">Hola ${data.patientName},</h2>
                    <p style="margin: 0 0 12px;">Tu nutricionista <strong>${data.nutritionistName}</strong> te envió una notificación desde tu portal de contacto especializado.</p>
                    <div style="padding: 16px; border-radius: 12px; background: #f8fafc; border: 1px solid #e2e8f0; margin: 20px 0;">
                      <p style="margin: 0 0 8px; font-weight: 700;">${data.title}</p>
                      <p style="margin: 0;">${data.message.replace(/\n/g, '<br />')}</p>
                    </div>
                    <p style="margin: 0;">Ingresa a tu portal para revisarla junto con tus consultas y seguimiento.</p>
                  </div>
                `,
            });
            console.log(`âœ… NotificaciÃ³n de portal enviada a: ${data.email}`);
        } catch (error) {
            console.error('âŒ Error enviando notificaciÃ³n de portal:', error);
        }
    }
}
