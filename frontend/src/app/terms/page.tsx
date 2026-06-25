import type { Metadata } from "next";
import { LegalPage, type LegalSection } from "@/components/legal/LegalPage";

export const metadata: Metadata = {
  title: "Términos de Servicio",
  description: "Términos de Servicio de NutriNet para el uso de la plataforma por profesionales de nutrición.",
};

const sections: LegalSection[] = [
  {
    title: "1. Naturaleza del servicio",
    paragraphs: [
      "NutriNet es una plataforma de software orientada a profesionales de la nutrición y dietética para apoyar la gestión de pacientes, la planificación alimentaria, la generación de documentos y la organización del trabajo clínico.",
      "La plataforma no reemplaza el juicio profesional, la evaluación clínica ni la responsabilidad del usuario sobre las decisiones que adopte en la atención de sus pacientes.",
    ],
  },
  {
    title: "2. Uso permitido",
    paragraphs: [
      "El uso de NutriNet está permitido únicamente a personas mayores de edad que actúen en el ejercicio de su actividad profesional o con autorización suficiente para ello.",
      "El usuario se obliga a proporcionar información veraz, completa y actualizada, y a mantener la confidencialidad de sus credenciales de acceso.",
    ],
  },
  {
    title: "3. Responsabilidad profesional",
    paragraphs: [
      "El usuario es el único responsable de la atención clínica que presta, de la información que ingresa en la plataforma y de la revisión y aprobación final de recetas, porciones, indicaciones, cálculos y entregables.",
      "El usuario debe verificar alergias, restricciones, patologías, interacciones y cualquier antecedente clínico relevante antes de usar o entregar contenido generado con apoyo de la plataforma.",
    ],
  },
  {
    title: "4. Uso de inteligencia artificial",
    paragraphs: [
      "NutriNet puede incorporar funciones de inteligencia artificial para generar, sugerir, resumir o reformular información. Las salidas de IA son orientativas y pueden contener errores, omisiones o sesgos.",
      "Toda salida generada por IA debe ser revisada antes de su uso clínico. La IA no constituye diagnóstico, prescripción ni indicación clínica autónoma.",
    ],
  },
  {
    title: "5. Conductas prohibidas",
    paragraphs: [
      "Se prohíbe ingresar información falsa o no autorizada, vulnerar la seguridad de la plataforma, intentar acceder a cuentas o datos ajenos, usar la plataforma con fines ilícitos o abusivos, o copiar, revender o sublicenciar la plataforma sin autorización.",
    ],
  },
  {
    title: "6. Seguridad y disponibilidad",
    paragraphs: [
      "NutriNet adopta medidas razonables de seguridad técnicas y organizativas. Sin perjuicio de ello, ningún sistema es completamente infalible.",
      "La plataforma puede presentar caídas, inconsistencias o cambios mientras evoluciona el servicio, y algunas funciones pueden modificarse, limitarse o suspenderse por razones técnicas u operativas.",
    ],
  },
  {
    title: "7. Propiedad intelectual y terminación",
    paragraphs: [
      "La plataforma, su diseño, código, textos, flujos, interfaces y demás elementos protegibles pertenecen a NutriNet o a sus licenciantes.",
      "NutriNet podrá suspender o terminar cuentas y accesos cuando exista incumplimiento de estos Términos, uso abusivo, fraudulento o inseguro, o por razones técnicas, legales o de operación.",
    ],
  },
  {
    title: "8. Contacto",
    paragraphs: [
      "Para consultas legales o de soporte relacionadas con estos Términos, escribe a contacto@nutrinet.cl.",
    ],
  },
];

export default function TermsPage() {
  return (
    <LegalPage
      title="Términos de Servicio"
      description="Condiciones generales de uso de NutriNet para profesionales de nutrición y dietética."
      lastUpdated="24 de junio de 2026"
      sections={sections}
    />
  );
}
