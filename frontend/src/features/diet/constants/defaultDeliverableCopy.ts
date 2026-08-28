/**
 * Plantillas por defecto para la Introducción y la Despedida del PDF
 * personalizado de /dashboard/dieta. El nutricionista puede editarlas
 * libremente en el wizard; estos son solo los valores iniciales.
 */

const PATIENT_PLACEHOLDER = "{nombrePaciente}";

export const DEFAULT_INTRO_TEMPLATE = `Hola ${PATIENT_PLACEHOLDER}, este es tu plan de alimentación personalizado, diseñado especialmente para ayudarte a alcanzar tus objetivos de forma simple y sostenible. A continuación encontrarás tu plan de comidas, las recetas que preparamos juntos, tu lista de compras y recursos que te van a acompañar en el proceso.`;

export const DEFAULT_CLOSING_TEMPLATE = `Gracias por confiar en este proceso, ${PATIENT_PLACEHOLDER}. Este plan es un punto de partida: recuerda que los ajustes forman parte del camino y que estoy aquí para acompañarte en cada control. Ante cualquier duda, no dudes en escribirme.`;

export function resolveDeliverableCopyTemplate(
  template: string,
  patientName?: string | null,
): string {
  const name = patientName?.trim();
  if (!name) {
    return template.replace(new RegExp(PATIENT_PLACEHOLDER, "g"), "").replace(/\s{2,}/g, " ").trim();
  }
  return template.replace(new RegExp(PATIENT_PLACEHOLDER, "g"), name);
}
