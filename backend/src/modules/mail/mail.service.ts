import { Injectable } from '@nestjs/common';
import { MailerService, ISendMailOptions } from '@nestjs-modules/mailer';
import * as nodemailer from 'nodemailer';

type SupportEmailRequestData = {
  fullName?: string;
  email?: string;
  phone?: string;
  professionalId?: string;
  specialty?: string;
  message?: string;
};

@Injectable()
export class MailService {
  constructor(private readonly mailerService: MailerService) {}

  private getSupportInboxEmail(): string {
    return process.env.ADMIN_EMAIL || 'contactonutrinet.cl@gmail.com';
  }

  /**
   * Intenta enviar el correo usando la configuración primaria (usualmente puerto 465).
   * Si falla por problemas de red o timeout, intenta un fallback automático vía puerto 587 (STARTTLS).
   */
  private async sendMailWithFallback(mailOptions: ISendMailOptions): Promise<void> {
    const email = mailOptions.to as string;
    try {
      // Intento 1: Configuración primaria inyectada por MailerModule
      await this.mailerService.sendMail(mailOptions);
      console.log(`✅ [MailService] Correo enviado con éxito a: ${email}`);
    } catch (primaryError: any) {
      // Si el error parece ser de red o timeout, intentamos el fallback
      const isNetworkError = primaryError.code === 'ENETUNREACH' || primaryError.code === 'ETIMEDOUT' || primaryError.message?.toLowerCase().includes('timeout');
      
      if (!isNetworkError) {
        console.error(`❌ [MailService] Error permanente enviando a ${email}:`, primaryError.message || primaryError);
        return;
      }

      console.warn(`⚠️ [MailService] Intento primario falló para ${email} (${primaryError.code || 'Timeout'}). Iniciando Fallback (Puerto 587)...`);
      
      try {
        // Intento 2: Fallback manual usando puerto 587 (STARTTLS)
        // Usamos nodemailer directamente para saltarnos la configuración fija del módulo
        const fallbackTransporter = nodemailer.createTransport({
          host: process.env.MAIL_HOST || 'smtp.gmail.com',
          port: 587,
          secure: false, // false para STARTTLS en puerto 587
          auth: {
            user: process.env.MAIL_USER,
            pass: process.env.MAIL_PASS,
          },
          family: 4, // Forzamos IPv4 también en el fallback
          connectionTimeout: 10000,
          greetingTimeout: 10000,
          socketTimeout: 20000,
        });

        const from = (mailOptions.from as string) || `"NutriNet Support" <${process.env.MAIL_FROM || process.env.MAIL_USER}>`;

        await fallbackTransporter.sendMail({
            ...mailOptions,
            from,
        });
        
        console.log(`✅ [MailService] Correo enviado vía FALLBACK (587) con éxito a: ${email}`);
      } catch (secondaryError: any) {
        console.error(`❌ [MailService] Error CRÍTICO enviando a ${email} (Primario y Fallback fallaron):`, secondaryError.message || secondaryError);
      }
    }
  }

  async sendWelcomeEmail(
    email: string,
    fullName: string,
    password: string,
    validAdminMessage?: string,
  ): Promise<void> {
    console.log(`📧 [MailService] Preparando correo de bienvenida para: ${email}`);
    await this.sendMailWithFallback({
      to: email,
      subject:
        '🌿 ¡Bienvenido a NutriNet! Tus credenciales de acceso',
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
  }

  async sendRegistrationConfirmation(
    email: string,
    fullName: string,
  ): Promise<void> {
    console.log(`📧 [MailService] Preparando confirmación de registro para: ${email}`);
    await this.sendMailWithFallback({
      to: email,
      subject: '✅ Recibimos tu solicitud - NutriNet',
      template: 'request-confirmation',
      context: {
        name: fullName,
        year: new Date().getFullYear(),
      },
    });
  }

  async sendAdminNotification(
    requestData: SupportEmailRequestData,
  ): Promise<void> {
    const adminEmail = this.getSupportInboxEmail();
    console.log(`📧 [MailService] Notificando al administrador sobre nueva solicitud: ${requestData.email}`);
    await this.sendMailWithFallback({
      to: adminEmail,
      subject:
        '? Nueva Solicitud de Registro',
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
  }

  async sendFeedback(data: {
    type: string;
    subject: string;
    message: string;
    fromEmail: string;
  }): Promise<void> {
    const adminEmail = this.getSupportInboxEmail();
    console.log(`📧 [MailService] Enviando feedback (${data.type}) de ${data.fromEmail} al admin`);
    await this.sendMailWithFallback({
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
  }

  async sendFeedbackConfirmation(email: string): Promise<void> {
    console.log(`📧 [MailService] Enviando confirmación de feedback a: ${email}`);
    await this.sendMailWithFallback({
      to: email,
      subject:
        '💬 Recibimos tu feedback - NutriNet',
      template: 'request-confirmation',
      context: {
        name: 'Usuario',
        year: new Date().getFullYear(),
      },
    });
  }

  async sendRejectionEmail(
    email: string,
    fullName: string,
    adminMessage?: string,
  ) {
    console.log(`📧 [MailService] Enviando correo de rechazo a: ${email}`);
    await this.sendMailWithFallback({
      to: email,
      subject: 'Actualización sobre tu solicitud - NutriNet',
      template: 'rejection',
      context: {
        name: fullName,
        adminMessage: adminMessage || '',
        year: new Date().getFullYear(),
      },
    });
  }

  async sendPasswordResetEmail(
    email: string,
    fullName: string,
    password: string,
  ) {
    console.log(`📧 [MailService] Enviando recuperación de contraseña a: ${email}`);
    await this.sendMailWithFallback({
      to: email,
      subject: '🔒 Recuperación de Acceso - NutriNet',
      template: 'password-reset',
      context: {
        name: fullName,
        email: email,
        password: password,
        loginUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
        year: new Date().getFullYear(),
      },
    });
  }

  async sendPatientPortalInvitationEmail(data: {
    email: string;
    patientName: string;
    nutritionistName: string;
    shareUrl: string;
    expiresAt: Date;
    accessCode: string;
  }) {
    await this.sendMailWithFallback({
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
  }
  async sendPatientPortalNotificationEmail(data: {
    email: string;
    patientName: string;
    nutritionistName: string;
    title: string;
    message: string;
  }) {
    await this.sendMailWithFallback({
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
  }

  async sendBookingLinkEmail(data: {
    email: string;
    nutritionistName: string;
    bookingUrl: string;
  }) {
    await this.sendMailWithFallback({
      to: data.email,
      subject: `📅 Reserva tu cita con ${data.nutritionistName}`,
      html: `
        <div style="font-family: 'Inter', Arial, sans-serif; line-height: 1.6; color: #1e293b; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
          <div style="background-color: #6366f1; padding: 32px 24px; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 24px; font-weight: 800;">Agendar Cita</h1>
          </div>
          <div style="padding: 32px 24px; background-color: white;">
            <p style="margin: 0 0 16px; font-size: 16px;">Hola,</p>
            <p style="margin: 0 0 24px; font-size: 16px;">Tu nutricionista <strong>${data.nutritionistName}</strong> te ha compartido su enlace de agendamiento público para que puedas elegir el horario que más te acomode.</p>
            
            <div style="text-align: center; margin: 32px 0;">
              <a href="${data.bookingUrl}" style="background-color: #6366f1; color: white; padding: 16px 32px; border-radius: 12px; text-decoration: none; font-weight: 800; font-size: 16px; display: inline-block;">
                Ver Disponibilidad y Agendar
              </a>
            </div>

            <p style="margin: 32px 0 8px; font-size: 14px; color: #64748b;">También puedes usar este enlace directo:</p>
            <p style="margin: 0; font-size: 12px; color: #6366f1; word-break: break-all;">${data.bookingUrl}</p>
          </div>
          <div style="background-color: #f8fafc; padding: 24px; text-align: center; border-top: 1px solid #e2e8f0;">
            <p style="margin: 0; font-size: 12px; color: #94a3b8;">&copy; ${new Date().getFullYear()} NutriNet. Este es un correo automático.</p>
          </div>
        </div>
      `,
    });
  }
}
