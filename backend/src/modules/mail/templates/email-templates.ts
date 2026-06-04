const escapeHtml = (value: string) =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const wrapEmail = (params: { title: string; body: string; ctaLabel?: string; ctaUrl?: string }) => `<!DOCTYPE html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapeHtml(params.title)}</title></head><body style="margin:0;background:#f8fafc;font-family:Arial,sans-serif;color:#0f172a"><div style="max-width:640px;margin:0 auto;padding:24px"><div style="background:#fff;border:1px solid #e2e8f0;border-radius:24px;overflow:hidden;box-shadow:0 20px 45px rgba(15,23,42,.06)"><div style="background:linear-gradient(135deg,#4f46e5,#10b981);padding:28px 24px;color:#fff"><div style="font-size:24px;font-weight:800;letter-spacing:.02em">NutriNet</div><div style="opacity:.92;margin-top:6px">${escapeHtml(params.title)}</div></div><div style="padding:28px 24px;line-height:1.65">${params.body}${params.ctaLabel && params.ctaUrl ? `<p style="margin-top:28px"><a href="${escapeHtml(params.ctaUrl)}" style="display:inline-block;background:#4f46e5;color:#fff;text-decoration:none;padding:12px 18px;border-radius:999px;font-weight:700">${escapeHtml(params.ctaLabel)}</a></p>` : ''}</div></div><div style="text-align:center;color:#64748b;font-size:12px;padding:16px 0">NutriNet · Chile</div></div></body></html>`;

export function buildWelcomeEmailTemplate(params: {
  fullName: string;
  email: string;
  password: string;
  loginUrl: string;
  adminMessage?: string;
}) {
  const html = wrapEmail({
    title: 'Tu cuenta fue creada',
    body: `<p>Hola <strong>${escapeHtml(params.fullName)}</strong>,</p><p>Tu cuenta profesional en NutriNet fue creada correctamente.</p><div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:18px;padding:18px 20px;margin:20px 0"><div style="font-size:12px;text-transform:uppercase;color:#64748b;font-weight:700;letter-spacing:.08em">Correo</div><div style="font-size:18px;font-weight:700;margin-bottom:12px">${escapeHtml(params.email)}</div><div style="font-size:12px;text-transform:uppercase;color:#64748b;font-weight:700;letter-spacing:.08em">Contraseña temporal</div><div style="font-family:monospace;font-size:18px;font-weight:700">${escapeHtml(params.password)}</div></div>${params.adminMessage ? `<p style="padding:12px 14px;background:#ecfdf5;border-left:4px solid #10b981;border-radius:12px"><strong>Mensaje del administrador:</strong><br>${escapeHtml(params.adminMessage)}</p>` : ''}<p style="margin-top:24px;color:#64748b;font-size:14px">Cambia tu contraseña apenas ingreses.</p>`,
    ctaLabel: 'Iniciar sesión',
    ctaUrl: params.loginUrl,
  });

  const text = [
    `Tu cuenta fue creada en NutriNet.`,
    `Correo: ${params.email}`,
    `Contraseña temporal: ${params.password}`,
    params.adminMessage ? `Mensaje del administrador: ${params.adminMessage}` : null,
    `Iniciar sesión: ${params.loginUrl}`,
  ]
    .filter(Boolean)
    .join('\n');

  return { html, text };
}

export function buildRegistrationAlertEmailTemplate(params: {
  fullName: string;
  email: string;
  message?: string;
}) {
  const html = wrapEmail({
    title: 'Nuevo registro en NutriNet',
    body: `<p>Se registró una nueva cuenta desde la landing de NutriNet.</p><div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:18px;padding:18px 20px;margin:20px 0"><p style="margin:0 0 8px"><strong>Nombre:</strong> ${escapeHtml(params.fullName)}</p><p style="margin:0 0 8px"><strong>Correo:</strong> ${escapeHtml(params.email)}</p><p style="margin:0"><strong>Mensaje:</strong><br>${escapeHtml(params.message || 'Sin mensaje adicional.')}</p></div>`,
  });

  const text = [
    'Nuevo registro en NutriNet',
    `Nombre: ${params.fullName}`,
    `Correo: ${params.email}`,
    `Mensaje: ${params.message || 'Sin mensaje adicional.'}`,
  ].join('\n');

  return { html, text };
}

export function buildRegistrationConfirmationEmailTemplate(params: {
  fullName: string;
}) {
  const html = wrapEmail({
    title: 'Solicitud recibida',
    body: `<p>Hola <strong>${escapeHtml(params.fullName)}</strong>,</p><p>Recibimos tu solicitud de registro en NutriNet. Nuestro equipo revisará tus datos y te contactará por correo.</p><p style="color:#64748b;font-size:14px">Gracias por tu interés en NutriNet.</p>`,
  });

  return {
    html,
    text: `Hola ${params.fullName}. Recibimos tu solicitud de registro en NutriNet y te contactaremos por correo.`,
  };
}
