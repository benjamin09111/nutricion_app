export type EmailChannel = 'noReply' | 'support' | 'notifications' | 'contact';
export type AnnouncementSenderEmail =
  | 'notificaciones@nutrinet.cl'
  | 'soporte@nutrinet.cl'
  | 'pagos@nutrinet.cl'
  | 'info@nutrinet.cl'
  | 'seguridad@nutrinet.cl'
  | 'marketing@nutrinet.cl'
  | 'rrhh@nutrinet.cl';

const fallback = (
  value: string | undefined,
  defaultValue: string | undefined,
): string => value?.trim() || defaultValue || '';

export const EMAIL_IDENTITIES: Record<EmailChannel, string> = {
  noReply:
    fallback(process.env.RESEND_FROM_NO_REPLY, process.env.RESEND_FROM) ||
    'NutriNet <no-reply@nutrinet.cl>',
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

export const ANNOUNCEMENT_FROM_IDENTITIES: Record<
  AnnouncementSenderEmail,
  string
> = {
  'notificaciones@nutrinet.cl':
    'NutriNet Notificaciones <notificaciones@nutrinet.cl>',
  'soporte@nutrinet.cl': 'NutriNet Soporte <soporte@nutrinet.cl>',
  'pagos@nutrinet.cl': 'NutriNet Pagos <pagos@nutrinet.cl>',
  'info@nutrinet.cl': 'NutriNet Info <info@nutrinet.cl>',
  'seguridad@nutrinet.cl': 'NutriNet Seguridad <seguridad@nutrinet.cl>',
  'marketing@nutrinet.cl': 'NutriNet Marketing <marketing@nutrinet.cl>',
  'rrhh@nutrinet.cl': 'NutriNet RRHH <rrhh@nutrinet.cl>',
};
