"use client";

import type { ClinicalRecordPdfData } from "./ClinicalRecordPdfDocument";

/**
 * Generates and downloads a Clinical Record PDF on the client side.
 * Uses dynamic import to avoid SSR issues with @react-pdf/renderer.
 */
export async function downloadClinicalRecordPdf(data: ClinicalRecordPdfData): Promise<void> {
  const [{ pdf }, { ClinicalRecordPdfDocument }, React] = await Promise.all([
    import("@react-pdf/renderer"),
    import("./ClinicalRecordPdfDocument"),
    import("react"),
  ]);

  const doc = React.createElement(ClinicalRecordPdfDocument, { data }) as any;
  const blob = await pdf(doc).toBlob();

  const safeName = (data.patientName || "Paciente")
    .replace(/\s+/g, "_")
    .replace(/[^\w-]/g, "");
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `Ficha_Clinica_${safeName}_NutriNet.pdf`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
