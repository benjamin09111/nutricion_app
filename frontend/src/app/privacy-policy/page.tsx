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
    title: "2. Datos que tratamos",
    paragraphs: [
      "Podemos tratar datos de identificación del usuario profesional, datos de contacto, credenciales de acceso, información de uso de la plataforma, y registros técnicos o de seguridad.",
      "También podemos tratar datos que el usuario profesional ingresa sobre pacientes, incluidos antecedentes nutricionales, restricciones alimentarias, hábitos, objetivos, observaciones, recetas, cálculos y documentos asociados.",
    ],
  },
  {
    title: "3. Finalidades",
    paragraphs: [
      "Tratamos los datos para operar la plataforma, gestionar cuentas, autenticar usuarios, almacenar y mostrar información nutricional o clínica, generar recetas, porciones, PDFs y otras herramientas de apoyo, mantener seguridad y soporte, y mejorar el servicio.",
      "Cuando se utilicen funciones automatizadas o de inteligencia artificial, los datos podrán ser procesados para generar sugerencias, textos o estructuras de apoyo, siempre bajo revisión del profesional.",
    ],
  },
  {
    title: "4. Base de tratamiento",
    paragraphs: [
      "Respecto del usuario profesional, el tratamiento se basa en la relación de uso de la plataforma, medidas precontractuales, cumplimiento de obligaciones legales e intereses legítimos compatibles con la operación y seguridad del servicio.",
      "Respecto de datos de pacientes ingresados por el usuario, el usuario declara y garantiza que cuenta con base legal suficiente para dicho tratamiento.",
    ],
  },
  {
    title: "5. Compartición de datos",
    paragraphs: [
      "NutriNet no vende datos personales. Los datos podrán compartirse únicamente cuando sea necesario con proveedores tecnológicos o de infraestructura, servicios de autenticación, almacenamiento, monitoreo, procesamiento o inteligencia artificial, y autoridades cuando exista obligación legal válida.",
    ],
  },
  {
    title: "6. Conservación y seguridad",
    paragraphs: [
      "Los datos se conservarán por el tiempo necesario para cumplir las finalidades informadas, dar continuidad al servicio, cumplir obligaciones legales, resguardar seguridad y resolver controversias.",
      "NutriNet adopta medidas razonables de seguridad administrativas, técnicas y organizativas para proteger la información contra acceso no autorizado, pérdida, alteración o divulgación indebida.",
    ],
  },
  {
    title: "7. Derechos y contacto",
    paragraphs: [
      "El titular de los datos podrá ejercer los derechos que reconozca la normativa aplicable, incluyendo acceso, rectificación, actualización, supresión u oposición, según corresponda.",
      "Para solicitudes relacionadas con privacidad, escribe a contacto@nutrinet.cl.",
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
