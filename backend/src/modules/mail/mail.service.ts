import { Injectable, Logger } from '@nestjs/common';
import {
  buildRegistrationAlertEmailTemplate,
  buildRegistrationConfirmationEmailTemplate,
  buildWelcomeEmailTemplate,
} from './templates/email-templates';
import { DEFAULT_REPLY_TO, EMAIL_IDENTITIES, type EmailChannel } from './email-identities';

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
  private readonly logger = new Logger(MailService.name);
  private readonly apiKey = process.env.RESEND_API_KEY?.trim() || '';
  private readonly replyTo =
    DEFAULT_REPLY_TO || process.env.ADMIN_EMAIL?.trim() || 'contacto@nutrinet.cl';
  private readonly frontendUrl = (
    process.env.FRONTEND_URL || 'https://nutrinet.cl'
  ).replace(/\/$/, '');
  private readonly adminEmail =
    process.env.ADMIN_EMAIL?.trim() || this.replyTo || 'contacto@nutrinet.cl';

  private escapeHtml(value: string) {
    return value
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  private wrapHtml(title: string, body: string) {
    return `<!DOCTYPE html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${this.escapeHtml(title)}</title></head><body style="margin:0;background:#f8fafc;font-family:Arial,sans-serif;color:#0f172a"><div style="max-width:600px;margin:0 auto;padding:24px"><div style="background:#fff;border:1px solid #e2e8f0;border-radius:20px;overflow:hidden"><div style="background:linear-gradient(135deg,#4f46e5,#10b981);padding:28px 24px;color:#fff"><div style="font-size:24px;font-weight:800;letter-spacing:.02em">NutriNet</div><div style="opacity:.92;margin-top:6px">${this.escapeHtml(title)}</div></div><div style="padding:28px 24px;line-height:1.6">${body}</div></div><div style="text-align:center;color:#64748b;font-size:12px;padding:16px 0">NutriNet · Chile</div></div></body></html>`;
  }

  private resolveFrom(channel: EmailChannel) {
    return EMAIL_IDENTITIES[channel];
  }

  private async sendEmail(params: {
    to: string | string[];
    subject: string;
    html: string;
    text?: string;
    replyTo?: string | string[];
    from?: string;
    channel?: EmailChannel;
  }): Promise<void> {
    if (!this.apiKey) {
      const message = 'RESEND_API_KEY no configurada';
      if (process.env.NODE_ENV === 'production') {
        throw new Error(message);
      }
      this.logger.warn(`${message}. Email omitido en desarrollo.`);
      return;
    }

    const replyTo =
      params.replyTo === undefined
        ? params.channel === 'noReply'
          ? undefined
          : this.replyTo
        : params.replyTo;

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: params.from || this.resolveFrom(params.channel || 'noReply'),
        to: params.to,
        subject: params.subject,
        html: params.html,
        text: params.text,
        ...(replyTo ? { reply_to: replyTo } : {}),
      }),
    });

    if (!response.ok) {
      const detail = await response.text().catch(() => '');
      throw new Error(
        `Resend respondió ${response.status}: ${detail || 'sin detalle'}`,
      );
    }
  }

  async sendWelcomeEmail(
    email: string,
    fullName: string,
    password: string,
    validAdminMessage?: string,
  ): Promise<void> {
    const loginUrl = `${this.frontendUrl}/login`;
    const { html, text } = buildWelcomeEmailTemplate({
      fullName,
      email,
      password,
      loginUrl,
      adminMessage: validAdminMessage,
    });

    await this.sendEmail({
      to: email,
      subject: 'Bienvenido a NutriNet',
      html,
      text,
      channel: 'noReply',
      replyTo: undefined,
    });
  }

  async sendRegistrationConfirmation(
    email: string,
    fullName: string,
  ): Promise<void> {
    const { html, text } = buildRegistrationConfirmationEmailTemplate({
      fullName,
    });

    await this.sendEmail({
      to: email,
      subject: 'Hemos recibido tu solicitud en NutriNet',
      html,
      text,
      channel: 'noReply',
    });
  }

  async sendRegistrationAlert(
    fullName: string,
    email: string,
    message?: string,
  ): Promise<void> {
    const { html, text } = buildRegistrationAlertEmailTemplate({
      fullName,
      email,
      message,
    });

    await this.sendEmail({
      to: this.adminEmail,
      subject: 'Nuevo registro en NutriNet',
      html,
      text,
      channel: 'notifications',
      replyTo: email,
    });
  }

  async sendAdminNotification(
    requestData: SupportEmailRequestData,
  ): Promise<void> {
    const html = this.wrapHtml(
      'Nueva solicitud de soporte',
      `<p>Se recibió una nueva solicitud desde la plataforma.</p><ul style="line-height:1.9;padding-left:18px"><li><strong>Nombre:</strong> ${this.escapeHtml(requestData.fullName || 'N/D')}</li><li><strong>Correo:</strong> ${this.escapeHtml(requestData.email || 'N/D')}</li><li><strong>Teléfono:</strong> ${this.escapeHtml(requestData.phone || 'N/D')}</li><li><strong>Profesional ID:</strong> ${this.escapeHtml(requestData.professionalId || 'N/D')}</li><li><strong>Especialidad:</strong> ${this.escapeHtml(requestData.specialty || 'N/D')}</li></ul><p><strong>Mensaje:</strong><br>${this.escapeHtml(requestData.message || 'Sin mensaje')}</p>`,
    );

    await this.sendEmail({
      to: this.adminEmail,
      subject: 'Nueva solicitud en NutriNet',
      html,
      text: `Nueva solicitud. Correo: ${requestData.email || 'N/D'}. Mensaje: ${requestData.message || 'Sin mensaje'}`,
      replyTo: requestData.email || this.replyTo,
      channel: 'support',
    });
  }

  async sendFeedback(data: {
    type: string;
    subject: string;
    message: string;
    fromEmail: string;
  }): Promise<void> {
    const html = this.wrapHtml(
      'Nuevo feedback',
      `<p><strong>Tipo:</strong> ${this.escapeHtml(data.type)}</p><p><strong>Asunto:</strong> ${this.escapeHtml(data.subject)}</p><p><strong>Mensaje:</strong><br>${this.escapeHtml(data.message).replace(/\n/g, '<br>')}</p>`,
    );

    await this.sendEmail({
      to: this.adminEmail,
      subject: `Feedback NutriNet: ${data.subject}`,
      html,
      text: `Tipo: ${data.type}\nAsunto: ${data.subject}\nMensaje: ${data.message}`,
      replyTo: data.fromEmail,
      channel: 'support',
    });
  }

  async sendFeedbackConfirmation(email: string): Promise<void> {
    const html = this.wrapHtml(
      'Feedback recibido',
      `<p>Gracias por escribirnos. Hemos recibido tu mensaje y lo revisaremos pronto.</p>`,
    );

    await this.sendEmail({
      to: email,
      subject: 'Hemos recibido tu mensaje en NutriNet',
      html,
      text: 'Gracias por escribirnos. Hemos recibido tu mensaje y lo revisaremos pronto.',
      channel: 'noReply',
    });
  }

  async sendRejectionEmail(
    email: string,
    fullName: string,
    adminMessage?: string,
  ) {
    const html = this.wrapHtml(
      'Solicitud no aprobada',
      `<p>Hola <strong>${this.escapeHtml(fullName)}</strong>,</p><p>Gracias por tu interés en NutriNet. En este momento no podemos aprobar tu solicitud.</p>${adminMessage ? `<p style="padding:12px 14px;background:#fff7ed;border-left:4px solid #f59e0b;border-radius:12px"><strong>Observación:</strong><br>${this.escapeHtml(adminMessage)}</p>` : ''}<p>Si quieres, puedes responder este correo para más información.</p>`,
    );

    await this.sendEmail({
      to: email,
      subject: 'Actualización sobre tu solicitud en NutriNet',
      html,
      text: `Hola ${fullName}. Tu solicitud no fue aprobada en este momento.${adminMessage ? ` Observación: ${adminMessage}` : ''}`,
      channel: 'noReply',
    });
  }

  async sendPasswordResetEmail(
    email: string,
    fullName: string,
    password: string,
  ) {
    const loginUrl = `${this.frontendUrl}/login`;
    const html = this.wrapHtml(
      'Tu contraseña fue restablecida',
      `<p>Hola <strong>${this.escapeHtml(fullName)}</strong>,</p><p>Restablecimos tu contraseña temporalmente.</p><div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:16px;padding:16px 18px;margin:20px 0"><div style="font-size:12px;text-transform:uppercase;color:#64748b;font-weight:700;letter-spacing:.08em">Contraseña temporal</div><div style="font-family:monospace;font-size:18px;font-weight:700">${this.escapeHtml(password)}</div></div><p><a href="${loginUrl}" style="display:inline-block;background:#4f46e5;color:#fff;text-decoration:none;padding:12px 18px;border-radius:999px;font-weight:700">Ingresar</a></p><p style="color:#64748b;font-size:14px">Cámbiala apenas entres al sistema.</p>`,
    );

    await this.sendEmail({
      to: email,
      subject: 'Restablecimiento de contraseña en NutriNet',
      html,
      text: `Tu contraseña temporal es: ${password}. Inicia sesión en ${loginUrl}`,
      channel: 'noReply',
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
    const html = this.wrapHtml(
      'Acceso al portal del paciente',
      `<p>Hola <strong>${this.escapeHtml(data.patientName)}</strong>,</p><p>Tu nutricionista <strong>${this.escapeHtml(data.nutritionistName)}</strong> te compartió acceso al portal del paciente.</p><div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:16px;padding:16px 18px;margin:20px 0"><div style="font-size:12px;text-transform:uppercase;color:#64748b;font-weight:700;letter-spacing:.08em">Código de acceso</div><div style="font-family:monospace;font-size:22px;font-weight:800;letter-spacing:.2em">${this.escapeHtml(data.accessCode)}</div><div style="margin-top:12px;font-size:12px;text-transform:uppercase;color:#64748b;font-weight:700;letter-spacing:.08em">Link</div><div style="word-break:break-all">${this.escapeHtml(data.shareUrl)}</div></div><p style="color:#64748b;font-size:14px">Vence el ${data.expiresAt.toLocaleDateString('es-CL')}.</p>`,
    );

    await this.sendEmail({
      to: data.email,
      subject: `Tu portal del paciente de NutriNet`,
      html,
      text: `Portal del paciente para ${data.patientName}. Código: ${data.accessCode}. Link: ${data.shareUrl}`,
      channel: 'noReply',
    });
  }

  async sendPatientPortalNotificationEmail(data: {
    email: string;
    patientName: string;
    nutritionistName: string;
    title: string;
    message: string;
  }) {
    const html = this.wrapHtml(
      `Nuevo mensaje de ${data.nutritionistName}`,
      `<p><strong>${this.escapeHtml(data.title)}</strong></p><p>${this.escapeHtml(data.message).replace(/\n/g, '<br>')}</p>`,
    );

    await this.sendEmail({
      to: data.email,
      subject: `Nuevo mensaje en tu portal de NutriNet`,
      html,
      text: `${data.title}\n\n${data.message}`,
      channel: 'notifications',
    });
  }

  async sendBookingLinkEmail(data: {
    email: string;
    nutritionistName: string;
    bookingUrl: string;
  }) {
    const html = this.wrapHtml(
      'Tu enlace de agendamiento',
      `<p>Hola,</p><p>${this.escapeHtml(data.nutritionistName)} te compartió este enlace para agendar:</p><p><a href="${this.escapeHtml(data.bookingUrl)}" style="color:#4f46e5;font-weight:700;word-break:break-all">${this.escapeHtml(data.bookingUrl)}</a></p>`,
    );

    await this.sendEmail({
      to: data.email,
      subject: `Enlace de agenda de ${data.nutritionistName}`,
      html,
      text: `Enlace para agendar: ${data.bookingUrl}`,
      channel: 'noReply',
    });
  }
}
