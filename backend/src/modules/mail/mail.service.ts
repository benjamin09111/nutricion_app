import { Injectable, Logger } from '@nestjs/common';
import {
  buildRegistrationAlertEmailTemplate,
  buildRegistrationConfirmationEmailTemplate,
  buildEmailVerificationTemplate,
  buildWelcomeEmailTemplate,
} from './templates/email-templates';
import {
  DEFAULT_REPLY_TO,
  ANNOUNCEMENT_FROM_IDENTITIES,
  EMAIL_IDENTITIES,
  type AnnouncementSenderEmail,
  type EmailChannel,
} from './email-identities';
import { resolveRequiredUrl } from '../../common/utils/runtime-url.util';

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
  private readonly isProduction = process.env.NODE_ENV === 'production';
  private readonly replyTo =
    DEFAULT_REPLY_TO ||
    process.env.ADMIN_EMAIL?.trim() ||
    'contacto@nutrinet.cl';
  private get frontendUrl() {
    const railwayUrl = process.env.RAILWAY_PUBLIC_DOMAIN
      ? `https://${process.env.RAILWAY_PUBLIC_DOMAIN}`
      : undefined;
    return resolveRequiredUrl(
      process.env.FRONTEND_URL,
      process.env.NEXT_PUBLIC_FRONTEND_URL,
      process.env.API_URL,
      railwayUrl,
    );
  }
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

  private wrapHtml(
    title: string,
    body: string,
    ctaLabel?: string,
    ctaUrl?: string,
  ) {
    return `<!DOCTYPE html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${this.escapeHtml(title)}</title></head><body style="margin:0;background:#f8fafc;font-family:Arial,sans-serif;color:#0f172a"><div style="max-width:600px;margin:0 auto;padding:24px"><div style="background:#fff;border:1px solid #e2e8f0;border-radius:20px;overflow:hidden"><div style="background:linear-gradient(135deg,#4f46e5,#10b981);padding:28px 24px;color:#fff"><div style="font-size:24px;font-weight:800;letter-spacing:.02em">NutriNet</div><div style="opacity:.92;margin-top:6px">${this.escapeHtml(title)}</div></div><div style="padding:28px 24px;line-height:1.6">${body}${ctaLabel && ctaUrl ? `<p style="margin-top:28px"><a href="${this.escapeHtml(ctaUrl)}" style="display:inline-block;background:#4f46e5;color:#fff;text-decoration:none;padding:12px 18px;border-radius:999px;font-weight:700">${this.escapeHtml(ctaLabel)}</a></p>` : ''}</div></div><div style="text-align:center;color:#64748b;font-size:12px;padding:16px 0">NutriNet · Chile</div></div></body></html>`;
  }

  private resolveFrom(channel: EmailChannel) {
    return EMAIL_IDENTITIES[channel];
  }

  private resolveAnnouncementFrom(fromEmail?: string) {
    if (!fromEmail) {
      return ANNOUNCEMENT_FROM_IDENTITIES['notificaciones@nutrinet.cl'];
    }

    return (
      ANNOUNCEMENT_FROM_IDENTITIES[fromEmail as AnnouncementSenderEmail] ||
      ANNOUNCEMENT_FROM_IDENTITIES['notificaciones@nutrinet.cl']
    );
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
    loginUrl: string,
    validAdminMessage?: string,
  ): Promise<void> {
    const { html, text } = buildWelcomeEmailTemplate({
      fullName,
      email,
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

  async sendVerificationEmail(
    email: string,
    fullName: string,
    verifyUrl: string,
  ): Promise<void> {
    const { html, text } = buildEmailVerificationTemplate({
      fullName,
      verifyUrl,
    });

    await this.sendEmail({
      to: email,
      subject: 'Confirma tu correo en NutriNet',
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

  async sendNutritionistInterestNotification(
    name: string,
    email: string,
  ): Promise<void> {
    const html = this.wrapHtml(
      'Nuevo interés de nutricionista',
      `<p>Un nutricionista ha manifiesto interés en NutriNet.</p><ul style="line-height:1.9;padding-left:18px"><li><strong>Nombre:</strong> ${this.escapeHtml(name)}</li><li><strong>Correo:</strong> ${this.escapeHtml(email)}</li></ul><p>Este nutricionista se unió al directorio público.</p>`,
    );

    await this.sendEmail({
      to: 'contacto@nutrinet.cl',
      subject: 'Nuevo interés de nutricionista en NutriNet',
      html,
      text: `Nuevo interés de nutricionista. Nombre: ${name}. Email: ${email}.`,
      replyTo: email,
      channel: 'notifications',
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

  async sendTransferNotification(data: {
    nutritionistName: string;
    nutritionistEmail: string;
    planName?: string;
    amount?: number;
    paymentId?: string;
    source?: string;
  }): Promise<void> {
    const amountLabel =
      typeof data.amount === 'number'
        ? new Intl.NumberFormat('es-CL', {
            style: 'currency',
            currency: 'CLP',
            maximumFractionDigits: 0,
          }).format(data.amount)
        : 'N/D';

    const html = this.wrapHtml(
      'Transferencia informada',
      `<p>Un nutricionista indicó que ya realizó una transferencia.</p><ul style="line-height:1.9;padding-left:18px"><li><strong>Nombre:</strong> ${this.escapeHtml(data.nutritionistName)}</li><li><strong>Correo:</strong> ${this.escapeHtml(data.nutritionistEmail)}</li><li><strong>Plan:</strong> ${this.escapeHtml(data.planName || 'N/D')}</li><li><strong>Monto:</strong> ${this.escapeHtml(amountLabel)}</li><li><strong>ID pago:</strong> ${this.escapeHtml(data.paymentId || 'N/D')}</li><li><strong>Origen:</strong> ${this.escapeHtml(data.source || 'N/D')}</li></ul>`,
    );

    await this.sendEmail({
      to: this.adminEmail,
      subject: 'Nutri informó una transferencia',
      html,
      text: [
        'Un nutricionista indicó que ya realizó una transferencia.',
        `Nombre: ${data.nutritionistName}`,
        `Correo: ${data.nutritionistEmail}`,
        `Plan: ${data.planName || 'N/D'}`,
        `Monto: ${amountLabel}`,
        `ID pago: ${data.paymentId || 'N/D'}`,
        `Origen: ${data.source || 'N/D'}`,
      ].join('\n'),
      channel: 'notifications',
    });
  }

  async sendAnnouncementEmail(data: {
    email: string;
    name?: string;
    title: string;
    message: string;
    link?: string;
    fromEmail?: string;
  }): Promise<void> {
    const html = this.wrapHtml(
      data.title,
      `<p>Hola${data.name ? ` <strong>${this.escapeHtml(data.name)}</strong>` : ''},</p><p>${this.escapeHtml(data.message).replace(/\n/g, '<br>')}</p>${data.link ? `<p><a href="${this.escapeHtml(data.link)}" style="display:inline-block;background:#4f46e5;color:#fff;text-decoration:none;padding:12px 18px;border-radius:999px;font-weight:700">Ver detalle</a></p>` : ''}`,
    );

    await this.sendEmail({
      to: data.email,
      subject: `NutriNet: ${data.title}`,
      html,
      text: `${data.title}\n\n${data.message}${data.link ? `\n${data.link}` : ''}`,
      from: this.resolveAnnouncementFrom(data.fromEmail),
      channel: 'notifications',
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

  async sendMeetingRequestEmail(data: {
    userEmail: string;
    subject: string;
    message: string;
  }): Promise<void> {
    const html = this.wrapHtml(
      'Solicitud de Reunión con NutriNet',
      `<p>El usuario <strong>${this.escapeHtml(data.userEmail)}</strong> desea agendar una reunión con el equipo de NutriNet.</p><ul style="line-height:1.9;padding-left:18px"><li><strong>Correo del solicitante:</strong> ${this.escapeHtml(data.userEmail)}</li><li><strong>Motivo de la reunión:</strong> ${this.escapeHtml(data.subject)}</li></ul><div style="margin-top:16px;padding:16px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px"><strong style="color:#4f46e5 font-size:12px uppercase">Detalle del motivo:</strong><br>${this.escapeHtml(data.message).replace(/\n/g, '<br>')}</div>`,
    );

    await this.sendEmail({
      to: 'contacto@nutrinet.cl',
      subject: `[SOLICITUD DE REUNIÓN] ${data.subject} (${data.userEmail})`,
      html,
      text: `Solicitud de reunión de: ${data.userEmail}\nMotivo: ${data.subject}\nDetalle: ${data.message}`,
      replyTo: data.userEmail,
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

  async sendFeedbackResolutionEmail(data: {
    email: string;
    type?: string;
    message?: string;
    adminMessage?: string;
  }): Promise<void> {
    const replyMessage =
      data.adminMessage ||
      'Hemos revisado tu mensaje y te responderemos pronto.';

    await this.sendSupportReplyEmail({
      email: data.email,
      originalMessage: data.message,
      type: data.type,
      replyMessage,
    });
  }

  async sendSupportReplyEmail(data: {
    email: string;
    originalMessage?: string;
    type?: string;
    replyMessage: string;
  }): Promise<void> {
    const originalBlock =
      data.type || data.originalMessage
        ? `<div style="margin:20px 0;padding:16px 18px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:16px"><div style="font-size:12px;text-transform:uppercase;color:#64748b;font-weight:700;letter-spacing:.08em">Mensaje original</div>${data.type ? `<div style="margin-top:8px"><strong>Tipo:</strong> ${this.escapeHtml(data.type)}</div>` : ''}${data.originalMessage ? `<div style="margin-top:8px"><strong>Mensaje:</strong><br>${this.escapeHtml(data.originalMessage).replace(/\n/g, '<br>')}</div>` : ''}</div>`
        : '';

    const html = this.wrapHtml(
      'Tienes una respuesta de NutriNet',
      `<p>Hola,</p><p>Gracias por escribirnos. Ya revisamos tu mensaje y aquí va nuestra respuesta.</p>${originalBlock}<div style="margin:20px 0;padding:16px 18px;background:#ecfdf5;border:1px solid #a7f3d0;border-left:4px solid #10b981;border-radius:16px"><div style="font-size:12px;text-transform:uppercase;color:#047857;font-weight:700;letter-spacing:.08em">Respuesta</div><div style="margin-top:8px;white-space:pre-line">${this.escapeHtml(data.replyMessage)}</div></div><p style="color:#64748b;font-size:14px">Saludos,<br><strong>Equipo de NutriNet</strong></p>`,
    );

    const text = [
      'Hemos respondido tu mensaje en NutriNet.',
      data.type ? `Tipo original: ${data.type}` : null,
      data.originalMessage ? `Mensaje original: ${data.originalMessage}` : null,
      `Respuesta: ${data.replyMessage}`,
      'Saludos, Equipo de NutriNet',
    ]
      .filter(Boolean)
      .join('\n\n');

    await this.sendEmail({
      to: data.email,
      subject: 'Hemos respondido tu mensaje en NutriNet',
      html,
      text,
      channel: 'support',
    });
  }

  async sendPublicProfileVisibilityEmail(data: {
    email: string;
    fullName: string;
    enabled: boolean;
    publicUrl?: string;
  }): Promise<void> {
    const title = data.enabled
      ? 'Tu perfil volvió a ser público'
      : 'Tu perfil fue ocultado del portal público';
    const subject = data.enabled
      ? 'Tu perfil público fue publicado en NutriNet'
      : 'Tu perfil público fue ocultado en NutriNet';
    const actionText = data.enabled
      ? 'Tu perfil ya está visible nuevamente en el portal público de NutriNet.'
      : 'Un administrador ocultó tu perfil del portal público. Tu acceso privado sigue activo.';
    const linkHtml =
      data.enabled && data.publicUrl
        ? `<p><a href="${this.escapeHtml(data.publicUrl)}" style="display:inline-block;background:#4f46e5;color:#fff;text-decoration:none;padding:12px 18px;border-radius:999px;font-weight:700">Ver perfil público</a></p>`
        : '';

    const html = this.wrapHtml(
      title,
      `<p>Hola <strong>${this.escapeHtml(data.fullName)}</strong>,</p><p>${this.escapeHtml(actionText)}</p>${linkHtml}`,
    );

    await this.sendEmail({
      to: data.email,
      subject,
      html,
      text: `${title}. ${actionText}${data.enabled && data.publicUrl ? ` Perfil: ${data.publicUrl}` : ''}`,
      channel: 'notifications',
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
    loginUrl: string,
  ) {
    const html = this.wrapHtml(
      'Tu acceso fue reenviado',
      `<p>Hola <strong>${this.escapeHtml(fullName)}</strong>,</p><p>Tu acceso a NutriNet ya está habilitado para iniciar sesión con Google.</p><p><a href="${loginUrl}" style="display:inline-block;background:#4f46e5;color:#fff;text-decoration:none;padding:12px 18px;border-radius:999px;font-weight:700">Iniciar con Google</a></p><p style="color:#64748b;font-size:14px">No necesitas contraseña para entrar.</p>`,
    );

    await this.sendEmail({
      to: email,
      subject: 'Tu acceso a NutriNet',
      html,
      text: `Tu acceso a NutriNet ya está habilitado. Inicia sesión con Google en ${loginUrl}`,
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

  async sendPatientPortalReplyEmail(data: {
    email: string;
    patientName: string;
    nutritionistName: string;
    question?: string | null;
    reply: string;
  }) {
    const portalUrl = `${this.frontendUrl}/portal/login`;
    const html = this.wrapHtml(
      `Tu nutricionista te ha respondido!`,
      `<p>Hola <strong>${this.escapeHtml(data.patientName)}</strong>,</p><p>Tu nutricionista <strong>${this.escapeHtml(data.nutritionistName)}</strong> te ha respondido en el portal.</p>${data.question ? `<div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:16px;padding:16px 18px;margin:20px 0"><div style="font-size:11px;text-transform:uppercase;color:#64748b;font-weight:700;letter-spacing:.08em;margin-bottom:8px">Tu pregunta</div><p style="margin:0">${this.escapeHtml(data.question).replace(/\n/g, '<br>')}</p></div>` : ''}<div style="background:#ecfdf5;border:1px solid #bbf7d0;border-radius:16px;padding:16px 18px;margin:20px 0"><div style="font-size:11px;text-transform:uppercase;color:#047857;font-weight:700;letter-spacing:.08em;margin-bottom:8px">Respuesta</div><p style="margin:0">${this.escapeHtml(data.reply).replace(/\n/g, '<br>')}</p></div><p style="color:#64748b;font-size:14px">Revisa su respuesta aquí.</p>`,
      'Abrir portal',
      portalUrl,
    );

    await this.sendEmail({
      to: data.email,
      subject: 'Tu nutricionista te ha respondido',
      html,
      text: `Tu nutricionista te ha respondido en el portal.\n\n${data.question ? `Tu pregunta: ${data.question}\n\n` : ''}Respuesta: ${data.reply}\n\nRevisa el portal aquí: ${portalUrl}`,
      channel: 'notifications',
    });
  }

  async sendPatientPortalMessageEmail(data: {
    email: string;
    patientName: string;
    nutritionistName: string;
    message: string;
  }) {
    const portalUrl = `${this.frontendUrl}/portal/login`;
    const html = this.wrapHtml(
      `Tu nutricionista te ha enviado un mensaje`,
      `<p>Hola <strong>${this.escapeHtml(data.patientName)}</strong>,</p><p>Tu nutricionista <strong>${this.escapeHtml(data.nutritionistName)}</strong> te ha enviado un mensaje en el portal.</p><div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:16px;padding:16px 18px;margin:20px 0"><p style="margin:0">${this.escapeHtml(data.message).replace(/\n/g, '<br>')}</p></div><p style="color:#64748b;font-size:14px">Revisa el mensaje aquí.</p>`,
      'Abrir portal',
      portalUrl,
    );

    await this.sendEmail({
      to: data.email,
      subject: 'Tu nutricionista te ha enviado un mensaje',
      html,
      text: `Tu nutricionista te ha enviado un mensaje en el portal.\n\n${data.message}\n\nRevisa el portal aquí: ${portalUrl}`,
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

  async sendAppointmentRequestEmail(data: {
    nutritionistEmail: string;
    nutritionistName: string;
    guestName: string;
    guestEmail: string;
    guestPhone?: string;
    message?: string;
    appointmentDate: Date;
  }) {
    const html = this.wrapHtml(
      'Nueva solicitud de cita',
      `<p>Hola <strong>${this.escapeHtml(data.nutritionistName)}</strong>,</p><p>Recibiste una nueva solicitud de cita.</p><div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:16px;padding:16px 18px;margin:20px 0"><div style="display:grid;grid-template-columns:1fr 1fr;gap:12px"><div><div style="font-size:11px;text-transform:uppercase;color:#64748b;font-weight:700;letter-spacing:.08em">Nombre</div><div style="font-weight:600">${this.escapeHtml(data.guestName)}</div></div><div><div style="font-size:11px;text-transform:uppercase;color:#64748b;font-weight:700;letter-spacing:.08em">Correo</div><div style="font-weight:600">${this.escapeHtml(data.guestEmail)}</div></div>${data.guestPhone ? `<div><div style="font-size:11px;text-transform:uppercase;color:#64748b;font-weight:700;letter-spacing:.08em">Teléfono</div><div style="font-weight:600">${this.escapeHtml(data.guestPhone)}</div></div>` : ''}<div><div style="font-size:11px;text-transform:uppercase;color:#64748b;font-weight:700;letter-spacing:.08em">Fecha solicitada</div><div style="font-weight:600">${data.appointmentDate.toLocaleDateString('es-CL', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</div></div></div></div>${data.message ? `<p><strong>Mensaje del paciente:</strong><br>${this.escapeHtml(data.message).replace(/\n/g, '<br>')}</p>` : ''}`,
    );

    await this.sendEmail({
      to: data.nutritionistEmail,
      subject: `Nueva solicitud de cita - ${data.guestName}`,
      html,
      text: `Nueva solicitud de cita de ${data.guestName} (${data.guestEmail})${data.guestPhone ? ` - ${data.guestPhone}` : ''} para el ${data.appointmentDate.toLocaleDateString('es-CL')}.${data.message ? ` Mensaje: ${data.message}` : ''}`,
      replyTo: data.guestEmail,
      channel: 'notifications',
    });
  }

  async sendAppointmentRequestReceivedEmail(data: {
    recipientEmail: string;
    recipientName: string;
    nutritionistName: string;
    timeZone: string;
    appointmentDate: Date;
    startTime: Date;
    endTime: Date;
    message?: string | null;
  }) {
    const html = this.wrapHtml(
      'Solicitud de cita recibida',
      `<p>Hola <strong>${this.escapeHtml(data.recipientName)}</strong>,</p><p>Recibimos tu solicitud de cita con <strong>${this.escapeHtml(data.nutritionistName)}</strong>.</p><p><strong>Fecha:</strong> ${data.appointmentDate.toLocaleDateString('es-CL', { timeZone: data.timeZone, weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}<br><strong>Horario:</strong> ${data.startTime.toLocaleTimeString('es-CL', { timeZone: data.timeZone, hour: '2-digit', minute: '2-digit', hour12: false })} - ${data.endTime.toLocaleTimeString('es-CL', { timeZone: data.timeZone, hour: '2-digit', minute: '2-digit', hour12: false })}</p>${data.message ? `<p><strong>Mensaje:</strong><br>${this.escapeHtml(data.message).replace(/\n/g, '<br>')}</p>` : ''}<p>Te avisaremos cuando el nutricionista la confirme.</p>`,
    );

    await this.sendEmail({
      to: data.recipientEmail,
      subject: `Solicitud recibida - ${data.nutritionistName}`,
      html,
      text: `Recibimos tu solicitud de cita con ${data.nutritionistName}.`,
      channel: 'notifications',
    });
  }

  async sendAppointmentConfirmedEmail(data: {
    recipientEmail: string;
    recipientName: string;
    nutritionistName: string;
    timeZone: string;
    appointmentDate: Date;
    startTime: Date;
    endTime: Date;
    message?: string | null;
  }) {
    const html = this.wrapHtml(
      'Cita confirmada',
      `<p>Hola <strong>${this.escapeHtml(data.recipientName)}</strong>,</p><p>Tu cita con <strong>${this.escapeHtml(data.nutritionistName)}</strong> fue confirmada.</p><p><strong>Fecha:</strong> ${data.appointmentDate.toLocaleDateString('es-CL', { timeZone: data.timeZone, weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}<br><strong>Horario:</strong> ${data.startTime.toLocaleTimeString('es-CL', { timeZone: data.timeZone, hour: '2-digit', minute: '2-digit', hour12: false })} - ${data.endTime.toLocaleTimeString('es-CL', { timeZone: data.timeZone, hour: '2-digit', minute: '2-digit', hour12: false })}</p>`,
    );

    await this.sendEmail({
      to: data.recipientEmail,
      subject: `Cita confirmada - ${data.nutritionistName}`,
      html,
      text: `Tu cita con ${data.nutritionistName} fue confirmada.`,
      channel: 'notifications',
    });
  }

  async sendAppointmentRejectedEmail(data: {
    recipientEmail: string;
    recipientName: string;
    nutritionistName: string;
    timeZone: string;
    appointmentDate: Date;
    startTime: Date;
    endTime: Date;
    reason?: string | null;
  }) {
    const html = this.wrapHtml(
      'Solicitud rechazada',
      `<p>Hola <strong>${this.escapeHtml(data.recipientName)}</strong>,</p><p>Tu solicitud de cita con <strong>${this.escapeHtml(data.nutritionistName)}</strong> fue rechazada.</p><p><strong>Fecha:</strong> ${data.appointmentDate.toLocaleDateString('es-CL', { timeZone: data.timeZone, weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}<br><strong>Horario:</strong> ${data.startTime.toLocaleTimeString('es-CL', { timeZone: data.timeZone, hour: '2-digit', minute: '2-digit', hour12: false })} - ${data.endTime.toLocaleTimeString('es-CL', { timeZone: data.timeZone, hour: '2-digit', minute: '2-digit', hour12: false })}</p>${data.reason ? `<p><strong>Motivo:</strong><br>${this.escapeHtml(data.reason).replace(/\n/g, '<br>')}</p>` : ''}`,
    );

    await this.sendEmail({
      to: data.recipientEmail,
      subject: `Solicitud rechazada - ${data.nutritionistName}`,
      html,
      text: `Tu solicitud de cita con ${data.nutritionistName} fue rechazada.${data.reason ? ` Motivo: ${data.reason}` : ''}`,
      channel: 'notifications',
    });
  }
}
