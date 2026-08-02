"use client";

import type { ProgressPdfData } from "./ProgressPdfDocument";
import { membershipService } from "@/features/memberships/services/membership.service";

export async function downloadProgressPdf(data: ProgressPdfData): Promise<void> {
  const [{ pdf }, { ProgressPdfDocument }, React] = await Promise.all([
    import("@react-pdf/renderer"),
    import("./ProgressPdfDocument"),
    import("react"),
  ]);

  const doc = React.createElement(ProgressPdfDocument, { data }) as any;
  const blob = await pdf(doc).toBlob();
  await membershipService.consumeQuota("pdf.exports.total.limit");

  const safeName = (data.patientName || "Paciente")
    .replace(/\s+/g, "_")
    .replace(/[^\w-]/g, "");
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `Evolucion_${safeName}_NutriNet.pdf`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
