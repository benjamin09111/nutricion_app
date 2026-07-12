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
    title: "3. Responsabilidad profesional y Ley 21.719",
    paragraphs: [
      "El usuario es el único responsable de la atención clínica que presta, de la información que ingresa en la plataforma y de la revisión y aprobación final de recetas, porciones, indicaciones, cálculos y entregables.",
      "Dado que los datos tratados (antropometría, alergias, embarazo/lactancia, historial clínico) están protegidos de manera especial por la Ley 21.719 de Chile, el profesional se compromete a actuar bajo los máximos estándares de confidencialidad y juicio profesional.",
      "El usuario debe verificar minuciosamente alergias, restricciones, patologías (especialmente pacientes renales, diabéticos o con alergias alimentarias severas), interacciones y cualquier antecedente clínico relevante antes de usar, aprobar o entregar contenido generado con apoyo de la plataforma.",
    ],
  },
  {
    title: "4. Uso de inteligencia artificial y subencargados",
    paragraphs: [
      "NutriNet incorpora funciones de inteligencia artificial para apoyar la planificación alimentaria. Dichas herramientas utilizan APIs externas (como OpenAI o Anthropic) en calidad de subencargados, regulados bajo un acuerdo de procesamiento de datos (DPA) que prohíbe el uso de datos de pacientes para el entrenamiento de modelos.",
      "El software incluye una barrera de validación clínica obligatoria: toda sugerencia generada por la IA debe ser revisada, editada y aprobada explícitamente por el profesional mediante el panel de validación clínica antes de ser consolidada o compartida con el paciente.",
      "La IA constituye un mero apoyo de productividad y en ningún caso reemplaza el criterio, diagnóstico, prescripción o indicación clínica del profesional de la salud.",
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
