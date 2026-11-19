import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      email,
      fullName,
      practiceArea,
      phone,
      source,
      subject,
    } = body;

    const cleanEmail = typeof email === "string" ? email.trim() : "";
    const cleanName =
      typeof fullName === "string" && fullName.trim()
        ? fullName.trim()
        : "No especificado";
    const cleanPracticeArea =
      typeof practiceArea === "string" && practiceArea.trim()
        ? practiceArea.trim()
        : "";
    const cleanPhone =
      typeof phone === "string" && phone.trim() ? phone.trim() : "";
    const cleanSource =
      typeof source === "string" && source.trim()
        ? source.trim()
        : "Landing Page NutriNet";

    if (!cleanEmail || !cleanEmail.includes("@")) {
      return NextResponse.json(
        { error: "Correo electrónico inválido" },
        { status: 400 },
      );
    }

    const resendApiKey = process.env.RESEND_API_KEY?.trim();
    if (!resendApiKey) {
      console.warn("RESEND_API_KEY no configurada en frontend. Omitiendo envío directo.");
      return NextResponse.json({ success: true, warning: "RESEND_API_KEY missing" });
    }

    const escapeHtml = (val: string) =>
      val.replace(/[&<>'"]/g, (c) => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        "'": "&#39;",
        '"': "&quot;",
      })[c] || c);

    const isJumpChile =
      cleanSource.toLowerCase().includes("jump") ||
      Boolean(cleanPracticeArea) ||
      Boolean(cleanPhone);

    const emailSubject =
      subject ||
      (isJumpChile
        ? `🚀 [Apoyo Jump Chile 2026] ${cleanName}`
        : `✨ [Interés NutriNet Demo] ${cleanName}`);

    const htmlContent = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 16px; background-color: #ffffff;">
        <h2 style="color: #0f172a; margin-top: 0; font-size: 20px; font-weight: 800; border-bottom: 2px solid #86A83C; padding-bottom: 12px;">
          ${escapeHtml(emailSubject)}
        </h2>
        <p style="color: #475569; font-size: 14px; line-height: 1.5;">
          Se ha recibido un nuevo registro de contacto y apoyo a través de la plataforma NutriNet:
        </p>
        <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 18px; margin: 18px 0; font-size: 14px; color: #1e293b;">
          <p style="margin: 0 0 10px 0;"><strong>👤 Nombre Completo:</strong> ${escapeHtml(cleanName)}</p>
          <p style="margin: 0 0 10px 0;"><strong>✉️ Correo Electrónico:</strong> <a href="mailto:${escapeHtml(cleanEmail)}" style="color: #4f46e5; text-decoration: none; font-weight: 600;">${escapeHtml(cleanEmail)}</a></p>
          ${cleanPracticeArea ? `<p style="margin: 0 0 10px 0;"><strong>💼 Área de Ejercicio:</strong> ${escapeHtml(cleanPracticeArea)}</p>` : ""}
          ${cleanPhone ? `<p style="margin: 0 0 10px 0;"><strong>📱 Teléfono / WhatsApp:</strong> <a href="tel:${escapeHtml(cleanPhone)}" style="color: #059669; text-decoration: none;">${escapeHtml(cleanPhone)}</a></p>` : ""}
          <p style="margin: 0 0 10px 0;"><strong>📍 Origen / Campaña:</strong> ${escapeHtml(cleanSource)}</p>
          <p style="margin: 0;"><strong>🕒 Fecha y Hora:</strong> ${new Date().toLocaleString("es-CL", { timeZone: "America/Santiago" })}</p>
        </div>
        <p style="color: #64748b; font-size: 12px; margin-top: 24px; border-top: 1px solid #f1f5f9; padding-top: 12px;">
          Notificación automática de NutriNet Chile · <a href="https://nutrinet.cl" style="color: #86A83C;">nutrinet.cl</a>
        </p>
      </div>
    `;

    const textContent = `
${emailSubject}
----------------------------------------
Nombre Completo: ${cleanName}
Correo Electrónico: ${cleanEmail}
${cleanPracticeArea ? `Área de Ejercicio: ${cleanPracticeArea}\n` : ""}${cleanPhone ? `Teléfono / WhatsApp: ${cleanPhone}\n` : ""}Origen: ${cleanSource}
Fecha y Hora: ${new Date().toLocaleString("es-CL", { timeZone: "America/Santiago" })}
    `.trim();

    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "NutriNet Contacto <contacto@nutrinet.cl>",
        to: "contacto@nutrinet.cl",
        reply_to: cleanEmail,
        subject: emailSubject,
        html: htmlContent,
        text: textContent,
      }),
    });

    if (!response.ok) {
      const errText = await response.text().catch(() => "");
      console.error("Error enviando email vía Resend en frontend:", errText);
      return NextResponse.json({ error: "Error en Resend" }, { status: 502 });
    }

    const result = await response.json();
    return NextResponse.json({ success: true, id: result.id });
  } catch (error: any) {
    console.error("Error en /api/demo-interest:", error);
    return NextResponse.json(
      { error: error?.message || "Error interno" },
      { status: 500 },
    );
  }
}
