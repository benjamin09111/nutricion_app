"use client";

import type { PautaAlimentacionPdfData } from "./PautaAlimentacionPdfDocument";

export async function downloadPautaAlimentacionPdf(
  data: PautaAlimentacionPdfData,
): Promise<void> {
  const [{ pdf }, { PautaAlimentacionPdfDocument }, React] = await Promise.all([
    import("@react-pdf/renderer"),
    import("./PautaAlimentacionPdfDocument"),
    import("react"),
  ]);

  const doc = React.createElement(PautaAlimentacionPdfDocument, { data });
  const blob = await pdf(doc as unknown as Parameters<typeof pdf>[0]).toBlob();

  const safeName =
    data.name.replace(/\s+/g, "_").replace(/[^\w-]/g, "") ||
    "pautas_alimentacion";
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${safeName}_NutriNet.pdf`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}