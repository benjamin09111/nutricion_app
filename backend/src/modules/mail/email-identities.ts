export type EmailChannel =
  | 'noReply'
  | 'support'
  | 'notifications'
  | 'contact';

const fallback = (
  value: string | undefined,
  defaultValue: string | undefined,
): string => value?.trim() || defaultValue || '';

export const EMAIL_IDENTITIES: Record<EmailChannel, string> = {
  noReply: fallback(
    process.env.RESEND_FROM_NO_REPLY,
    process.env.RESEND_FROM,
  ) || 'NutriNet <no-reply@nutrinet.cl>',
  support: fallback(
    process.env.RESEND_FROM_SUPPORT,
    'NutriNet Soporte <soporte@nutrinet.cl>',
  ),
  notifications: fallback(
    process.env.RESEND_FROM_NOTIFICATIONS,
    'NutriNet Notificaciones <notificaciones@nutrinet.cl>',
  ),
  contact: fallback(
    process.env.RESEND_FROM_CONTACT,
    'NutriNet Contacto <contacto@nutrinet.cl>',
  ),
};

export const DEFAULT_REPLY_TO =
  process.env.RESEND_REPLY_TO?.trim() || 'contacto@nutrinet.cl';
