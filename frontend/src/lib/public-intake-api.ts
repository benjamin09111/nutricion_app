import { isGuestMode } from "./demo-local-api";

export async function validatePublicIntakeToken(token: string) {
  if (token === "demo" || token.startsWith("demo-") || (isGuestMode() && token === "demo")) {
    return {
      valid: true,
      nutritionistName: "Nutricionista Demo",
      clinicName: "Consulta Nutricional Demo",
      patientEmail: "valentina@nutrinet.cl",
      patientName: "Valentina Miranda",
    };
  }
  const response = await fetch(`/api/public/patient-intake/validate/${token}`);
  return response.json();
}

export async function submitPublicIntakeForm(token: string, body: unknown) {
  if (token === "demo" || token.startsWith("demo-") || (isGuestMode() && token === "demo")) {
    return new Response(
      JSON.stringify({
        success: true,
        message: "Formulario completado exitosamente en modo demostración.",
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      },
    );
  }
  const response = await fetch(`/api/public/patient-intake/submit/${token}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  return response;
}
