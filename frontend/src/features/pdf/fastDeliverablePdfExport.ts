"use client";

import type { FastDeliverablePdfData } from "./FastDeliverablePdfDocument";
import { membershipService } from "@/features/memberships/services/membership.service";
import { getPdfQuotaKey } from "./pdfQuota";

export async function downloadFastDeliverablePdf(
  data: FastDeliverablePdfData,
  countQuota = true,
  quotaKey?: string,
): Promise<void> {
  const [{ pdf }, { FastDeliverablePdfDocument }, React] = await Promise.all([
    import("@react-pdf/renderer"),
    import("./FastDeliverablePdfDocument"),
    import("react"),
  ]);

  const doc = React.createElement(FastDeliverablePdfDocument, { data });
  const blob = await pdf(doc as unknown as Parameters<typeof pdf>[0]).toBlob();
  if (countQuota) {
    await membershipService.consumeQuota("pdf.exports.total.limit", 1, getPdfQuotaKey("fast-deliverable", data, quotaKey));
  }

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
