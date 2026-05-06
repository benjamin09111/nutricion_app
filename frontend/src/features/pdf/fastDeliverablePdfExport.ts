"use client";

import type { FastDeliverablePdfData } from "./FastDeliverablePdfDocument";

export async function downloadFastDeliverablePdf(
  data: FastDeliverablePdfData,
): Promise<void> {
  const [{ pdf }, { FastDeliverablePdfDocument }, React] = await Promise.all([
    import("@react-pdf/renderer"),
    import("./FastDeliverablePdfDocument"),
    import("react"),
  ]);

  const doc = React.createElement(FastDeliverablePdfDocument, { data });
  const blob = await pdf(doc as unknown as Parameters<typeof pdf>[0]).toBlob();

  const safeName =
    data.name.replace(/\s+/g, "_").replace(/[^\w-]/g, "") ||
    "entregable_rapido";
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${safeName}_NutriNet.pdf`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
