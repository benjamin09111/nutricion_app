"use client";

import type { ScreeningTestPdfData } from "./ScreeningTestPdfDocument";
import { membershipService } from "@/features/memberships/services/membership.service";

export async function downloadScreeningTestPdf(
  data: any,
  countQuota = true,
): Promise<void> {
  const [{ pdf }, { ScreeningTestPdfDocument }, React] = await Promise.all([
    import("@react-pdf/renderer"),
    import("./ScreeningTestPdfDocument"),
    import("react"),
  ]);

  const pdfData: ScreeningTestPdfData = {
    name: data.name || data.content?.testType || "Test_Tamizaje",
    content: data.content,
  };

  const doc = React.createElement(ScreeningTestPdfDocument, { data: pdfData });
  const blob = await pdf(doc as unknown as Parameters<typeof pdf>[0]).toBlob();

  if (countQuota) {
    await membershipService.consumeQuota("pdf.exports.total.limit");
  }

  const safeName =
    (data.name || "Test_Tamizaje")
      .replace(/\s+/g, "_")
      .replace(/[^\w-]/g, "") || "test_tamizaje";

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${safeName}_NutriNet.pdf`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
