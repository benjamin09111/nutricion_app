import type { Metadata } from "next";
import { LegalPage, type LegalSection } from "@/components/legal/LegalPage";

export const metadata: Metadata = {
  title: "Política de Privacidad",
  description: "Política de Privacidad de NutriNet para usuarios profesionales y tratamiento de datos de pacientes.",
};

const sections: LegalSection[] = [
  {
    title: "1. Responsable del tratamiento",
    paragraphs: [
      "NutriNet informa esta Política de Privacidad para explicar cómo se recopilan, utilizan, almacenan y protegen los datos personales tratados a través de la plataforma.",
      "Responsable de contacto: NutriNet. Correo de contacto: contacto@nutrinet.cl.",
    ],
  },
  {
    title: "2. Datos de salud especialmente protegidos",
    paragraphs: [
      "Tratamos datos de identificación, de contacto y credenciales de acceso del profesional.",
      "Asimismo, tratamos datos de salud de los pacientes ingresados por el profesional (como antropometría, alergias alimentarias, estado de embarazo/lactancia e historial clínico). En conformidad con la Ley 21.719 de Chile, estos datos pertenecen a una categoría de especial protección, por lo que aplicamos medidas reforzadas de resguardo.",
    ],
  },
  {
    title: "3. Finalidades y Evaluación de Impacto (EIPD)",
    paragraphs: [
      "Tratamos los datos para operar la plataforma, gestionar las fichas clínicas, calcular porciones e intercambios, y generar sugerencias nutricionales mediante inteligencia artificial.",
      "De acuerdo con lo exigido por la Ley 21.719, NutriNet ha llevado a cabo una Evaluación de Impacto en Protección de Datos (EIPD) antes del tratamiento de estas categorías especiales de datos de salud, con el fin de mitigar riesgos y asegurar la privacidad desde el diseño y por defecto.",
    ],
  },
  {
    title: "4. Base de tratamiento",
    paragraphs: [
      "Respecto del usuario profesional, el tratamiento se basa en la relación de uso de la plataforma, medidas precontractuales, cumplimiento de obligaciones legales e intereses legítimos compatibles con la operación y seguridad del servicio.",
      "Respecto de datos de pacientes ingresados por el usuario, el usuario profesional actúa como responsable del tratamiento y declara contar con el consentimiento informado o base legal habilitante según la normativa sanitaria vigente.",
    ],
  },
  {
    title: "5. Compartición de datos y Subencargados (DPA)",
    paragraphs: [
      "NutriNet no comercializa ni vende datos personales. Para el procesamiento de sugerencias nutricionales con inteligencia artificial, compartimos información de forma segura con proveedores tecnológicos externos (OpenAI/Anthropic) que actúan como subencargados del tratamiento.",
      "Mantenemos con dichos proveedores un acuerdo de procesamiento de datos (DPA) vinculante que prohíbe explícitamente el uso de datos de salud de los pacientes para entrenar sus modelos o para cualquier fin ajeno al servicio solicitado.",
    ],
  },
  {
    title: "6. Conservación, Cifrado en Reposo y Notificación en 72h",
    paragraphs: [
      "Los datos se conservan por el tiempo necesario para la prestación del servicio y el resguardo de la responsabilidad clínica.",
      "Implementamos estrictas medidas de seguridad técnica, incluyendo el cifrado de datos en reposo (AES-256) para todos los registros de salud y bases de datos clínicas, además de conexiones cifradas en tránsito (HTTPS/TLS).",
      "En caso de detectarse alguna brecha de seguridad que afecte los datos personales o clínicos, NutriNet se compromete a notificar a los profesionales afectados y a la autoridad correspondiente en un plazo máximo de 72 horas.",
    ],
  },
  {
    title: "7. Derechos ARCO completos",
    paragraphs: [
      "Los titulares de los datos y los profesionales autorizados pueden ejercer en cualquier momento sus derechos ARCO completos en el portal o escribiendo a contacto@nutrinet.cl:",
      "• Acceso: Consultar y descargar los datos clínicos completos en formatos estructurados.",
      "• Rectificación: Actualizar o corregir información errónea en la ficha del paciente.",
      "• Cancelación: Solicitar la supresión completa de los registros personales y clínicos.",
      "• Oposición: Deshabilitar o rechazar el tratamiento automatizado por inteligencia artificial mediante las configuraciones de la plataforma.",
    ],
  },
];

export default function PrivacyPolicyPage() {
  return (
    <LegalPage
      title="Política de Privacidad"
      description="Este documento explica cómo NutriNet trata los datos personales y clínicos dentro de la plataforma."
      lastUpdated="24 de junio de 2026"
      sections={sections}
    />
  );
}
